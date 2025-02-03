---
layout: doc
lang: en-US
title: '1.3 Healing Entities'
description: Healing Entity from its ailments. Adding generations and tie it to a world.
logo: /posts/ecs/3/logo.jpg # path to the main image
date: 2024-06-14 00:00:00 # post date
tags:
  - ecs
prev:
  link: '/posts/ecs/2' 
next:
  link: '/posts/ecs/4'
---
# {{ $frontmatter.title }}

## Let's Get Started

Entity, as we know, is just an ID of a slot, an index by which we can get some data in the world. In the ideal ECS world where we work with a single array - yes, it's just an int and we won't do anything else with it.

But we live in a different world - where within one application we can have a dozen worlds, there can be incompetent specialists and just non-standard situations. In such a case, it would be nice to lay down foolproof protection at the API level - this will secure runtime and avoid unnecessary checks.

## Entity Ailments

In fact, there are only two:
1. The entity died \ the ID was created not through the world
2. The entity is from another world

### 1. Invalid ID / Generation Problem

> The Entity that the world spits out to us is actually an EntityId. In ECS, there is no concept of an 'entity instance'.
> This is according to the canon, of course.

An invalid ID is treated with so-called generations. The essence is quite simple:
1. Embed in the entity identifier, in addition to the index, a unique identifier for using this index.
2. When using, check the usage identifier with what is currently stored in the world, perform the operation only if they are equal.
3. Increment the usage identifier when destroying the entity - this will immediately invalidate all other EntityIds.

Here, it's probably easier to show visually:

![](1.svg)

I hope it's clear enough. The point is that as soon as we delete an entity - we increment the internal identifier, thereby making all old pointers\entities\IDs invalid.

To achieve this, we need to extend the entity data type and record the generation when creating it.
Something like this:

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

We also need to adjust the world API for compatibility with the new addressing method:

<details>
    <summary>World.cs</summary>

> The full code can be found [here](https://github.com/blackbone/ecs/tree/main/ecs2)

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

Now, when trying to manipulate dead entities, we will get a juicy Exception:

::: code-group

```csharp{4} [Program.cs]
var world = new World();
var entity = world.CreateEntity();
world.DeleteEntity(entity);
world.AddComponent(entity, new Vector3()); // --> see Log
```

```log [Log]
Unhandled exception. System.Exception: Entity E:0[0] is dead!
   at ecs1.World.AddComponent[T](EntityId& entity, T& c) in ~/git/ecs/ecs2/World.cs:line 77
   at Program.<Main>$(String[] args) in ~/git/ecs/ecs2/Program.cs:line 7
```

:::

You can notice that when deleting an entity, the gen is incremented in the `unchecked` block.
This is necessary because, with active creation and deletion of entities, it can overflow quite quickly, and catching an `OverflowException` at runtime, especially when the inputs are floating, is very unpleasant.

> But if we cycle it around, at some point the old entity identifier will match the new one!

Yes, it will, but now it's not a 100% probability, but 1/65535. By playing with the size of `gen`, you can reduce this probability even more, but you will have to pay with the size of EntityId. I try to keep it within 64 bits.

### Binding Entities to Worlds

Here, by analogy: we need a unique world identifier that will be recorded in the EntityId when it is returned, which we check for equality every time we access the world API using the entity.

Let's adjust EntityId:

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

And in World, we will add the necessary code and checks:

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

And let's check all this:

::: code-group

```csharp{4} [Program.cs]
var world1 = new World();
var world2 = new World();
var entity = world1.CreateEntity();
world2.AddComponent(entity, new Vector3()); // --> see Log
```

```log [Log]
Unhandled exception. System.Exception: Entity E:1-0[0] not belongs to world W:2!
   at ecs1.World.AddComponent[T](EntityId& entity, T& c) in ~/git/ecs/ecs2/World.cs:line 85
   at Program.<Main>$(String[] args) in ~/git/ecs/ecs2/Program.cs:line 13
```

:::

That's basically it, there's not much to fix here, just optimize layouts and usage, but that's a topic for another post.
