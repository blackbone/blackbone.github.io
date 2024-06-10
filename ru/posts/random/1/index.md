---
layout: doc
lang: ru-RU
title: Пре-преамбула
description: Как сжечь жопу ECS'ами
logo: /posts/random/1/logo.jpg # путь к основной картинке
date: 2024-06-02 00:00:00 # дата и время для сортировки
tags:
  - random
  - ecs
  - benchmark
prev:
  text: 'Посты обо всём'
  link: '/ru/posts/random' 
next: false
---
# {{ $frontmatter.title }}

Пока писал [бенчмарки](https://github.com/blackbone/other-ecs-benchmarks) у меня несколько раз сгорала жопа.

> Ни в коем случае не осуждаю авторов фреймвокров - каждый делает под себя как ему нравится.

И сейчас в кратце объясню почему:

## Первое

Первое - инконсистентность апи, где-то добавлять компонент дважды ок и он просто перезатрется, где-то рыгнет ошибкой, где-то вообще отстрелит IndexOutOfRange в недрах. Я немножко задолбался покрывать каждый кейс проверками где надо, даже написал тесты на бенчмарки (ну и наркомания).
Тем не менее имеет место быть кейс, что перед проектированием почитать общепринятые практики, одной из мастхэвных для ECS фреймворков я считаю **CRUD**.

Педивикия [говорит](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) нам, что:
> In computer programming, create, read, update, and delete (CRUD) are the four basic operations of persistent storage. CRUD is also sometimes used to describe user interface conventions that facilitate viewing, searching, and changing information using computer-based forms and reports.

Если интерпретировать мир в ECS как некую базу данных (а мы ведь в нем и храним данные о сущностях), то обобщенный API должен представлять из себя методы Create, Read, Update и Delete.
При этом имеется 2 уровня этого самого CRUD'а:
1. Мир
2. Сущность

Для простоты восприятия представим что Entity имеет следующий вид, но не суть важно какая именно структура данных это будет:

```csharp
readonly struct Entity
{
  // id, gen, world id не суть важно
  // любые поля однозначно идентифицирующие сущность
}
```

Поскольку в зну ответственности мира входит как менеджмент самих сущностей, так и хранение компонентов, то CRUD API будет иметь следующий вид.

```csharp
// CRUD уровня мира
interface IWorld
{
  // [C]reate
  Entity CreateEntity();
  
  // [D]elete
  void DestroyEntity(in Entity entity)
}
```

> `Get` и `Update` в текущем контексте не несут абсолютно никакой смысловой нагрузки поскольку в ECS сущность - всего лишь идентификатор слота данных компонентов, удобный аксессор, не более, их можно исключить.

Учитывая что `Entity` это некий идентификатор, а для данных компонентов нужен свой CRUD, при этом он должен быть полный, а данные компонентов храняться непосредственно в мире - то апи расширяется до:

```csharp
// CRUD уровня сущности
interface IWorld
{
  // [C]reate
  void AddComponent<T>(in Entity entity, in T componentData);

  // [R]read
  T GetComponent<T>(in Entity entity);

  // [U]pdate
  void UpdateComponent<T>(in Entity entity, in T componentData);
  
  // [D]elete
  void DestroyComponent<T>(in Entity entity)
}
```

Объединив все эти методы мы получаем минимальный необходимый API для произведения структурных изменений, где каждый метод соответствует SRP, инкапсулирует логику, ясен-понятен и вообще молодец. Полный код выглядит вот так:

```csharp
// CRUD уровня сущности
interface IWorld
{
  // [C]reate::Entity
  Entity CreateEntity();
  
  // [D]elete::Entity
  void DestroyEntity(in Entity entity);

  // [C]reate::Component
  void AddComponent<T>(in Entity entity, in T componentData);

  // [R]read::Component
  T GetComponent<T>(in Entity entity);

  // [U]pdate::Component
  void UpdateComponent<T>(in Entity entity, in T componentData);
  
  // [D]elete::Component
  void DestroyComponent<T>(in Entity entity)
}
```

Естественно, возможны вариации через методы расширений типа Entity, или еще как нибудь, но я говорил исключительно об однозначности API.
Очень спорно использование API которое "гладит и стирает, еще и завтрак готовит".

> Тут я имею в виду всякие `SetComponent` и `DeleteComponent` удаляющий за собой сущность, но о нем дальше.

## Второе

Второе - удаление энтити при удалении последнего компонента. Я понимаю что в каноничном ECS как такового понятия `Entity` не существует и это просто идентификатор слота данных, но в общем случае имея следующий код:

```csharp
var world = new World();
var entity = world.CreateEntity();
entity.AddComponent(new Component1());
entity.RemoveComponent<Component1>();
entity.AddComponent(new Component2())
```

Тут на третьей строке открываются врата в ад, а на 7й мы в него попадаем, т.к. в 6й строке сущность, которую нам вернул мир уже упокоилась с миром (простите за таквтологию) и отправилась в пул для последующего реюза.

При этом имея код немножно попроще, а именно:

```csharp
var world = new World();
var entity = world.CreateEntity();
```

Мы получаем утечку памяти, потому что под эту новую энтити выделяются слоты в архетипах \ массивах компонентов \ спарс сетах или что там еще и...

...и **ничего дальше с этим не делается**.

Если позволяете создавать пустые энтити, позволяйте им и жить, в противном случае уберите этот портал в ад. Имхо - это просто полнейшая дичь и издевательство.

> *Критикуешь - предлагай*

Ок. Как насчет транзакционности? Builder никто не отменял.

```csharp
public class World
{
    public EntityBuilder CreateEntity() => new(this);

    // допустим, что тут мы создаем энтити и добавляем все компоненты
    internal Entity CreateEntity(IReadOnlyDictionary<Type, object> components) => new(id: 1);
}

public class EntityBuilder : IDisposable
{
    private readonly World _world;
    private readonly Dictionary<Type, object> components = new();

    internal EntityBuilder(World world) => _world = world;

    public void AddComponent<T>(in T v) => components[typeof(T)] = v;
    public void RemoveComponent<T>() => components.Remove(typeof(T));

    public Entity Build()
    {
        if (components.Count == 0) return Entity.Invalid;
        return _world.CreateEntity(components);
    }

    public void Dispose() { }
}

public struct Entity(int id) : IEquatable<Entity>
{
    private readonly int id = id;
    public static Entity Invalid = new(id: -1);

    public void AddComponent<T>(in T v) { }
    public void RemoveComponent<T>() { }

    public bool Equals(Entity other) => id == other.id;
    public override bool Equals(object obj) => obj is Entity other && Equals(other);
    public override int GetHashCode() => id;
}
```

Там сверху без деталей реализации, но концепция должна быть понятна. Такой подход превратит создание энтити в целостную операцию на уровне кода пользователя результатом которой может быть ТОЛЬКО создание валидной энтити, никаких пустых энтитей которые потом текут создать в таком случае не получится, разве что через реинтерпретацию типов, а использоваться оно будет вот так:

```csharp
var world = new World();
Entity entity;
using (var builder = world.CreateEntity())
{
    builder.AddComponent(v: new Component1());
    builder.AddComponent(v: new Component2());
    builder.AddComponent(v: new Component3());
    builder.RemoveComponent<Component2>();
    builder.RemoveComponent<Component1>();
    entity = builder.Build();
}

if (entity.Equals(Entity.Invalid)) return 1;
return 0;
```

И проверить можно, и выполнится оно всё одним куском, даже архетип можно сразу посчитать и впихнуть сразу куда надо. Ну и поскольку это Disposable - то и почистится тоже сразу.

## Компот

Т.е. десерт, последнее и третье - какого черта если можно создать сущность она не может жить самостоятельно, сам факт наличия энтити без данных это то же самое что и new object() vs null - толку от базового объекта ноль, но на уровне логики это можно интерпретировать как флаг, локер или еще что-то, на что хватит фантазии.
Тема этих сисек в существующей литературе, конечно же, слабо раскрывается.
Entity это ключик к данным где-то в мире, возможно данных у вас нет, но ключик то есть...

На самом деле компот притянут за уши из первого и второго и обобщает проблему проектирования API для юзера.

Если что-то делать нельзя - **ЗАПРЕЩАЙТЕ НА УРОВНЕ API** *пжалста*.

## Завязать жирок

> Это то, что делают после того как хорошо поел ...

Бесконечно можно ныть по поводу того, что где-то что-то плохо или тебе не нравится что никто еще не сделал именно так, как тебе надо. Но некоторые вещи хотелось бы обобщить.

1. В некоторых реализациях есть очень крутые решения нацеленные на перфу.
2. Некоторые интуитивно понятно реализованы и их очень приятно использовать даже не глядя в документацию, достаточно IntelliSense.
3. Некоторые очень простые для понимания подкапотных процессов, некоторые не очень.

Я специально не упоминал названия фреймворков и не выдавал никакой конкретики по ним просто чтоб не вызвать излишнее бурление говен.

Как говорила Долорес Амбридж:
> Давайте совершенствовать то, что можно усовершенствовать, беречь то, что необходимо беречь и избавляться от того, что должно быть недопустимым!