---
layout: doc
lang: ru-RU
title: '1.3 Лечим сущности'
description: Лечим Entity от ее болячек. Добавляем поколения и привязываем к миру.
logo: /posts/ecs/3/logo.jpg # путь к основной картинке
date: 2024-06-14 00:00:00 # дата поста
tags:
  - ecs
prev:
  link: '/posts/ecs/2' 
next:
  link: '/posts/ecs'
---
# {{ $frontmatter.title }}

## Начинаем начинать

Entity, как мы знаем - всего лишь айдишник слота, индекс по которому мы можем получить какие-то данные в мире. В идеальном мире ECS где мы работаем с одним массивом - да, это просто инт и мы с ним ничего больше делать не будем.

Но мы живем в другом мире - в котором в рамках одного приложения у нас может быть с десяток миров, могут быть некомпетентные специалисты и просто нестандартные ситуации. В таком случае было бы неплохо заложить защиту от дурака на уровне API - это и рантайм обезопасит и позволит избежать лишних проверок.

## Болячки сущностей

На самом деле их всего две:
1. Сущность померла \ айдишник создали не через мир
2. Сущность из другого мира

### 1. Инвалидный айдишник / проблема поколений

> Entity, который нам выплевывает мир - на самом деле EntityId. В ECS не существует понятия 'инстанс сущности'.
> Это если по канону, конечно же.

Лечится инвалидный айдишник т.н. поколениями (generations). Суть довольно проста:
1. Зашить в идентификатор сущности помимо индекса еще и некий уникальный идентификатор использования этого индекса.
2. При использовании проверять идентификатор использования с тем, что в данный момент хранится в мире, выполнять операцию только в случае равенства.
3. Инкрементировать идентификатор использования при уничтожении сущности - это сразу сделает инвалидными все остальные EntityId.

Тут, наверное, проще показать наглядно:

![](1.svg)

Надеюсь достаточно наглядно. Суть в том, что как только мы удаляем сущность - мы инкрементируем внутренний идентификатор, тем самым делая все старые указатели\сущности\айдишники невалидными.

Чтобы этого добиться нам нужно расширить тип данных сущности и записывать в него ген при создании.
Примерно вот так:

```csharp
public readonly struct EntityId : IEquatable<EntityId>
{
    public static readonly EntityId Invalid = new(0, 0);
    
    internal readonly int id;
    internal readonly ushort gen;
    
    public EntityId(int id, ushort gen)
    {
        this.id = id;
        this.gen = gen;
    }
    
    public bool Equals(EntityId other) => id == other.id && gen == other.gen;
    public override bool Equals(object? obj) => obj is EntityId other && Equals(other);
    public override int GetHashCode() => HashCode.Combine(id, gen);
    public override string ToString() => $"E:{id}[{gen}]";
    public static bool operator ==(EntityId a, EntityId b) => a.Equals(b);
    public static bool operator !=(EntityId a, EntityId b) => !a.Equals(b);
}
```

Так же нужно поправить API мира для совместимости с новым способом адресации:

<details>
    <summary>World.cs</summary>

> Полный код можно найти тут [тут](https://github.com/blackbone/ecs/tree/main/ecs2)

```csharp

public class World : IWorld<EntityId>
{
    private bool[] isAlive;     // [!code --]
    private ushort[] gen;       // [!code ++]

    // ...

    public World(int entityCount = 256) => Resize(entityCount);

    private void Resize(in int size)
    {
        var initialSize = isAlive?.Length ?? 0; // [!code --]
        var initialSize = gen?.Length ?? 0;     // [!code ++]
        if (initialSize >= size) return;

        Array.Resize(ref isAlive, size);        // [!code --]
        Array.Resize(ref gen, size);            // [!code ++]

        // ...
    }

    // CRUD [C]reate :: world
    public EntityId CreateEntity()
    {
        if (freeEntityIds.Count == 0) Resize(isAlive.Length + 32);  // [!code --]
        var entity = freeEntityIds.Dequeue();                       // [!code --]
        isAlive[entity] = true;                                     // [!code --]
        return entity;                                              // [!code --]
        if (freeEntityIds.Count == 0) Resize(gen.Length + 32);      // [!code ++]
        var entityId = freeEntityIds.Dequeue();                     // [!code ++]
        return new EntityId(entityId, gen[entityId]);               // [!code ++]
    }

    // CRUD [D]elete :: world
    public void DeleteEntity(in EntityId entity)
    {
        isAlive[entity] = false;                                                            // [!code --]
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!"); // [!code ++]
        unchecked                                                                           // [!code ++]
        {                                                                                   // [!code ++]
            gen[entity.id]++;                                                               // [!code ++]
        }                                                                                   // [!code ++]
    }

    // CRUD [C]reate :: entity
    public void AddComponent<T>(in int entityId, in T c)                                    // [!code --]
    public void AddComponent<T>(in EntityId entity, in T c)                                 // [!code ++]
    {
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!"); // [!code ++]
        
        // ...
    }

    // CRUD [R]ead/[U]pdate :: entity
    public ref T GetComponent<T>(in int entityId)                                           // [!code --]
    public ref T GetComponent<T>(in EntityId entity)                                        // [!code ++]
    {
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!"); // [!code ++]
        
        // ...
    }

    // CRUD [D]elete :: entity
    public void DeleteComponent<T>(in int entityId)                                         // [!code --]
    public void DeleteComponent<T>(in EntityId entity)                                      // [!code ++]
    {
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!"); // [!code ++]
        
        // ...
    }
}

```

</details>

Теперь при попытке манипулировать умершими сущностями мы будем получать смачный Excetion:

::: code-group

```csharp{4} [Program.cs]
var world = new World();
var entity = world.CreateEntity();
world.DeleteEntity(entity);
world.AddComponent(entity, new Vector3()); // --> смотри Log
```

```log [Log]
Unhandled exception. System.Exception: Entity E:0[0] is dead!
   at ecs1.World.AddComponent[T](EntityId& entity, T& c) in ~/git/ecs/ecs2/World.cs:line 77
   at Program.<Main>$(String[] args) in ~/git/ecs/ecs2/Program.cs:line 7
```

:::

Можно обратить внимание что при удалении сущности gen инкрементируется в `unchecked` блоке.
Это необходимо по той причине, что при активном создании и удалении сущностей он может довольно быстро переполниться, а ловить `OverflowException` в рантайме, особенно когда вводные плавающие ой как неприятно.

> Но если мы его крутим по кругу, то в какой-то момент наступит ситуация когда у нас старый идентификатор сущности совпадет с новым!

Да, наступит, но неперь это не 100% вероятность, а 1/65535. Играясь с размером `gen` можно уменьшить эту вероятность еще больше, но придется заплатить размером EntityId. Я стараюсь держать его в пределах 64 бит.

### Привязываем cущности к мирам

Тут по аналогии: нам нужен уникальный идентификатор мира который будет записываться в EntityId при ее возврате, который мы проверяем на равенство каждый раз при обращении к API мира с испольщованием сущности.

Прправим EntityId:

```csharp
public readonly struct EntityId : IEquatable<EntityId>
{
    public static readonly EntityId Invalid = new(0, 0);
    
    internal readonly int id;
    internal readonly ushort gen;
    internal readonly ushort worldId;                                                                       // [!code ++]
    
    public EntityId(int id, ushort gen)
    {
        this.id = id;
        this.gen = gen;
        this.worldId = worldId;                                                                             // [!code ++]
    }
    
    public bool Equals(EntityId other) => id == other.id && gen == other.gen;                               // [!code --]
    public bool Equals(EntityId other) => id == other.id && gen == other.gen && worldId == other.worldId;   // [!code ++]
    public override bool Equals(object? obj) => obj is EntityId other && Equals(other);
    public override int GetHashCode() => HashCode.Combine(id, gen);
    public override string ToString() => $"E:{id}[{gen}]";                                                  // [!code --]
    public override string ToString() => $"E:{worldId}-{id}[{gen}]";                                        // [!code ++]
    public static bool operator ==(EntityId a, EntityId b) => a.Equals(b);
    public static bool operator !=(EntityId a, EntityId b) => !a.Equals(b);
}
```

И в World добавим необходимый код и проверки:

```csharp
public class World : IWorld<EntityId>
{
    private static ushort worldsCounter = 0;
    private static ushort Id => ++worldsCounter;
    private readonly ushort id = Id;

    // ...

    public EntityId CreateEntity()
    {
        if (freeEntityIds.Count == 0) Resize(gen.Length + 32);
        var entityId = freeEntityIds.Dequeue();
        return new EntityId(entityId, gen[entityId]); // [!code --]
        return new EntityId(entityId, gen[entityId], id); // [!code ++]
    }

    public void DeleteEntity(in EntityId entity)
    {
        if (entity.worldId != id) throw new Exception($"Entity {entity} not belongs to world {this}!"); // [!code ++]
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!");
        gen[entity.id]++;
    }

    public void AddComponent<T>(in EntityId entity, in T c)
    {
        if (entity.worldId != id) throw new Exception($"Entity {entity} not belongs to world {this}!"); // [!code ++]
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!");

        // ...
    }

    public ref T GetComponent<T>(in EntityId entity)
    {
        if (entity.worldId != id) throw new Exception($"Entity {entity} not belongs to world {this}!"); // [!code ++]
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!");

        // ...
    }

    public void DeleteComponent<T>(in EntityId entity)
    {
        if (entity.worldId != id) throw new Exception($"Entity {entity} not belongs to world {this}!"); // [!code ++]
        if (gen[entity.id] != entity.gen) throw new Exception($"Entity {entity} is dead!");

        // ...
    }

    public override string ToString() => $"W:{id}"; // [!code ++]
}
```

Ну и проверим это всё:

::: code-group

```csharp{4} [Program.cs]
var world1 = new World();
var world2 = new World();
var entity = world1.CreateEntity();
world2.AddComponent(entity, new Vector3()); // --> смотри Log
```

```log [Log]
Unhandled exception. System.Exception: Entity E:1-0[0] not belongs to world W:2!
   at ecs1.World.AddComponent[T](EntityId& entity, T& c) in ~/git/ecs/ecs2/World.cs:line 85
   at Program.<Main>$(String[] args) in ~/git/ecs/ecs2/Program.cs:line 13
```

:::

На этом, в принципе всё, лечить тут особо нечего, только оптимизировать лейауты и использование, но это тема для отдельного поста.