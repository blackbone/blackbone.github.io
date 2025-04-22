---
layout: doc
lang: en-US
title: Pre-Preamble
description: How to get frustrated with ECS
logo: /posts/random/1/logo.jpg # path to the main image
date: 2024-06-02 00:00:00 # date and time for sorting
tags:
  - random
  - ecs
  - benchmark
  - ai-translated
prev:
  link: '/posts/random' 
next: false
---
# {{ $frontmatter.title }}

While writing [benchmarks](https://github.com/blackbone/other-ecs-benchmarks), I got frustrated several times.

> I do not judge the authors of frameworks - everyone does it the way they like.

And now I'll briefly explain why:

## First

First - API inconsistency. In some places, adding a component twice is okay and it just gets overwritten, in others, it throws an error, and in some cases, it even shoots an IndexOutOfRange deep inside. I got a bit tired of covering each case with checks where needed, even wrote tests for the benchmarks (which was quite a hassle).
Nevertheless, there is a case to be made for reading up on generally accepted practices before designing. One of the must-haves for ECS frameworks, in my opinion, is **CRUD**.

Wikipedia [tells](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) us that:
> In computer programming, create, read, update, and delete (CRUD) are the four basic operations of persistent storage. CRUD is also sometimes used to describe user interface conventions that facilitate viewing, searching, and changing information using computer-based forms and reports.

If we interpret the world in ECS as a kind of database (since we store data about entities in it), then a generalized API should represent methods for Create, Read, Update, and Delete.
There are 2 levels of this CRUD:
1. World
2. Entity

For simplicity, let's imagine that Entity looks like this, but it doesn't really matter what the data structure is:

```csharp
readonly struct Entity
{
  // id, gen, world id are not important
  // any fields that uniquely identify the entity
}
```

Since the world's responsibility includes both managing the entities themselves and storing components, the CRUD API will look like this:

```csharp
// World-level CRUD
interface IWorld
{
  // [C]reate
  Entity CreateEntity();
  
  // [D]elete
  void DestroyEntity(in Entity entity)
}
```

> `Get` and `Update` in the current context carry absolutely no semantic load because in ECS an entity is just an identifier for a slot of component data, a convenient accessor, nothing more, they can be excluded.

Considering that `Entity` is some kind of identifier, and component data needs its own CRUD, which should be complete, and component data is stored directly in the world - the API expands to:

```csharp
// Entity-level CRUD
interface IWorld
{
  // [C]reate
  void AddComponent<T>(in Entity entity, in T componentData);

  // [R]ead
  T GetComponent<T>(in Entity entity);

  // [U]pdate
  void UpdateComponent<T>(in Entity entity, in T componentData);
  
  // [D]elete
  void DestroyComponent<T>(in Entity entity)
}
```

Combining all these methods, we get the minimal necessary API for making structural changes, where each method corresponds to SRP, encapsulates logic, is clear and understandable. The full code looks like this:

```csharp
// Entity-level CRUD
interface IWorld
{
  // [C]reate::Entity
  Entity CreateEntity();
  
  // [D]elete::Entity
  void DestroyEntity(in Entity entity);

  // [C]reate::Component
  void AddComponent<T>(in Entity entity, in T componentData);

  // [R]ead::Component
  T GetComponent<T>(in Entity entity);

  // [U]pdate::Component
  void UpdateComponent<T>(in Entity entity, in T componentData);
  
  // [D]elete::Component
  void DestroyComponent<T>(in Entity entity)
}
```

Of course, there can be variations through extension methods like Entity, or something else, but I was talking exclusively about the unambiguity of the API.
It's very debatable to use an API that "washes, irons, and even cooks breakfast."

> Here I mean things like `SetComponent` and `DeleteComponent` that delete the entity along with the component, but more on that later.

## Second

Second - deleting an entity when the last component is removed. I understand that in canonical ECS there is no such concept as `Entity` and it's just an identifier for a data slot, but generally, having the following code:

```csharp
var world = new World();
var entity = world.CreateEntity();
entity.AddComponent(new Component1());
entity.RemoveComponent<Component1>();
entity.AddComponent(new Component2())
```

Here, on the third line, the gates to hell open, and on the 7th we enter it, because on the 6th line the entity that the world returned to us has already passed away (sorry for the tautology) and went to the pool for subsequent reuse.

At the same time, having slightly simpler code, namely:

```csharp
var world = new World();
var entity = world.CreateEntity();
```

We get a memory leak because slots are allocated for this new entity in archetypes/component arrays/sparse sets or whatever else and...

...and **nothing else is done with it**.

If you allow creating empty entities, allow them to live as well, otherwise remove this portal to hell. In my opinion - this is just complete nonsense and mockery.

> *Criticize - offer*

Okay. How about transactional? Builder is still an option.

```csharp
public class World
{
    public EntityBuilder CreateEntity() => new(this);

    // let's assume here we create an entity and add all components
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

The above is without implementation details, but the concept should be clear. This approach will turn entity creation into a holistic operation at the user code level, the result of which can ONLY be the creation of a valid entity, no empty entities that then leak can be created in this case, except through type reinterpretation, and it will be used like this:

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

And it can be checked, and it will all be executed in one go, you can even calculate the archetype right away and insert it where needed. And since it's Disposable - it will also be cleaned up immediately.

## Compote

That is, dessert, the last and third - why on earth if you can create an entity it cannot live independently, the very fact of having an entity without data is the same as new object() vs null - the basic object is useless, but at the logic level, it can be interpreted as a flag, locker, or something else, as far as your imagination goes.
The topic of these things is, of course, poorly covered in existing literature.
Entity is a key to data somewhere in the world, you may not have data, but you have the key...

In fact, the compote is pulled by the ears from the first and second and generalizes the problem of designing an API for the user.

If something cannot be done - **PROHIBIT IT AT THE API LEVEL** *please*.

## Tie the fat

> This is what they do after a good meal...

You can endlessly whine about something being bad or you don't like that no one has done it exactly the way you need it. But some things would be nice to generalize.

1. In some implementations, there are very cool solutions aimed at performance.
2. Some are intuitively implemented and very pleasant to use even without looking at the documentation, IntelliSense is enough.
3. Some are very simple to understand the underlying processes, some are not.

I deliberately did not mention the names of frameworks and did not provide any specifics about them just to avoid unnecessary controversy.

As Dolores Umbridge said:
> Let us improve what can be improved, preserve what must be preserved, and eliminate what should be unacceptable!
