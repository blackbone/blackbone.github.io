---
layout: doc
lang: en-US
title: '1.1 Theory One (or ECS for Dummies)'
description: 'In simple terms, I tried to understand what ECS is.
Primarily for myself, but maybe someone will find this post useful as well.'
logo: '/posts/ecs/1/logo.jpg'
date: 2024-06-3 00:00:00 # post date
tags:
  - ecs
  - ai-translated
prev:
  link: '/posts/ecs' 
next:
  link: '/posts/ecs/2'
---
# {{ $frontmatter.title }}

::: warning
This post has been translated by artificial intelligence and needs proofreading.
:::

> A post to summarize information and possibly help beginners understand the basic concepts.

To answer right away:

> Yes, I also decided to write my own ECS and even had a couple of attempts to start, but in one way or another, I ran into some limitations, so this time I will move thoroughly, step by step, and possibly even with feedback.

## What is ECS and how to use it

What does [Wikipedia](https://en.wikipedia.org/wiki/Entity_component_system) tell us:

> Entity component system (ECS) is a software architectural pattern mostly used in video game development for the representation of game world objects. An ECS comprises entities composed from components of data, with systems which operate on the components.
> ECS follows the principle of composition over inheritance, meaning that every entity is defined not by a type hierarchy, but by the components that are associated with it. Systems act globally over all entities which have the required components.
> Due to an ambiguity in the English language, however, a common interpretation of the name is that an ECS is a system comprising entities and components.

In a nutshell: *an architectural pattern where entities are compositions of components, whose logic is processed by systems*.

All ECS stuff is gathered into one heap, and this heap is called the world.

## World

World (or world) is a high-level abstraction, usually a class, aggregating many entities and systems that modify and manipulate entities within the context of the world.

The world often also has an external API allowing interaction with it from an external context - for example, creating entities upon user or network input.

The world is, you could say, a container for entities, components, and systems.

## Entity

Entities themselves are nothing without components - they cannot be processed by systems, they do not store user data (they can, but it's not canonical), and they do not have their own behavior.

In canonical ECS, they are just indices in a global array. In non-canonical ones, they are some abstract nonentities, like a classmate you can't remember. In all cases, they are unique identifiers that unambiguously define an entity in a specific world.

If in the context of the world the identifier means nothing, then for the external context the very fact of the entity's existence may already have some significance (but more on that later).

## Component

Components are the building blocks from which an entity is constructed. It is the set of components that defines what an entity is. These building blocks contain only data describing the state of the entity, but no logic.

> If it flies and quacks, then it's a duck.
> If it has a flying and quacking component, then it's also a duck.
> Two identical quacks in a duck cannot exist, it's either the same quack or different ones.

But components themselves cannot live independently, just as flying or quacking cannot exist on their own. A component is a property of an entity, so they are stored together - a component is directly or indirectly linked to the entity's ID.

In the simplest version, data can be represented as a two-dimensional array or table, where each column is a component type, and each row is the index of our entity, something like this:

![1](1.svg)

But as the number of entities grows and considering that not all components will be used on all entities, it will look more like this:

![2](2.svg)

... the scale is reduced, but in a medium-complexity project, this is a hundred or two types of components and several thousand entities.

> It looks very much like a table in a relational database with the only difference being that each cell is a separate data structure.
> But personally, it reminds me of a truth table. If grouped by existing components and detached from the grid, it can be mapped to a subset in a set.
> I will return to truth tables and set theory more than once.

As you can see, the data is quite sparse, and storing it in a two-dimensional array will not be very efficient, especially considering that these will most likely be structures, not classes (both structures and classes can have different sizes, but it doesn't matter - since they will be stored somewhere randomly in the heap), and also of different sizes, but more on that later - now we are dealing with concepts.

In addition to storing data, it is also necessary to manipulate it - change, retrieve, filter, etc. Most frameworks use concepts such as Filter, Query, and System. Let's consider each in order:

## Filter / Query

Filters and queries are something like an SQL query `select entity from * where Component1 != null & Component2 != null & Component3 == null`, i.e., a mechanism for selecting a set of entities from all existing ones.

Usually implemented as an immutable class \ structure that morphs with extension methods and has a method returning a **subset of entities**.

For the filter described above, the match from the previous illustration would be entities 3 and 9.

> In fact, all this ECS stuff is very much intertwined with Boolean algebra and set theory - I recommend [reading](https://plato.stanford.edu/ENTRIES/boolalg-math/) or [watching](https://www.youtube.com/playlist?list=PLTd6ceoshprcTJdg5AI6i2D2gZR5r8_Aw).

Filtering is mostly done based on the presence or absence of a component, in rare cases - based on the component's data for two reasons:

1. The presence and absence of a component are tracked for other areas of ECS usage, including archetypes (more on them later).
2. To process the component's data, it needs to be retrieved, which can significantly impact performance with a large number of entities. Moreover, based on point 1 - information about the presence of a component can be stored separately from the data and in a different form, for example, in a bitmask.

> Some ECS implementations support in-place iteration over a filter without the need to save a subset of entities and iterate over it.

> In some frameworks, this is the only available mechanism to do something with entities en masse, besides direct references to the entities themselves.

## System

A system in canonical ECS is the logic for manipulating data described (ideally) as a static function that takes references to specific components as arguments and does not return any values.

> The most interesting thing is that nowhere is it described whose responsibility it is to query entities and push them into systems. Such a design hole, in my opinion.
> Or maybe it's not a hole, just such a blurred pattern "store data like this, process it like this, and how you will marry one with the other - we don't really care."

In practice, a system usually represents an instance of a class implementing the ISystem interface with an Update method, which is passed into the world and stored in it. This solves several problems such as:

1. The order of system calls - determined by the order of adding systems to the world.
2. Parameterization and dependency injection - input or some configs, for example.
3. Injection of internal dependencies - systems need to get references to component data somewhere, so usually, this is done by the systems themselves when added to the world (they get various pools and stashes to query them later).
4. The ability to "disable" systems - sometimes useful.

Systems rarely work with one type of component, more often - with a specific set, while some components act as input data, some as output - but these sets are not mutually exclusive.

> For example, to move an object in space, you need at least 2 components: Position and Velocity, where each of them can act as both input and output data - we get the current position and movement vector, add the vector * time to the position, subtract damping from the vector, for example.

> In complex cases, the number of components can reach ten or more - but such systems are better decomposed into more atomic ones.

## Archetype {#archetype}

The concept of an archetype was born out of the iteration problem (hello DOD).

When we have many entities with a large number of different combinations on them - it is efficient to "grind" through the system only if all the necessary components are nearby, and we simply take the needed ones in a loop.

Hence the approach "put ducks with ducks, and apples with apples" was born.

This approach allows processing both ducks and apples separately, as well as together if they are both edible.

From a technical point of view, an archetype is a subset of components based on composition. The illustration below clearly shows what the structure of a world using archetypes looks like:

![3](3.svg)

More complex, scarier, but allows iterating only over entities with the required set of components, ignoring others.

But there is also a price, direct access through the entity is burdened with extra accesses to various caches, mappings, sparse sets, etc., which negatively affects the performance of atomic operations.

> For example, if our system needs all entities with components 1 and 3, then iteration will occur only over archetype 4.

> If by components 3 and 6 - over archetypes 1 and 4 respectively.

> If we want to get/change component 1 of entity 7, we need to:
> 1. look into the archetype table and find which archetype this entity belongs to.
> 2. look into the archetype and find under which index the data of this entity is stored.
> 3. get/change the component itself by index in the archetype.

## Aspect {#aspect}

There is also such a thing. In essence, it is just a set of component types, a piece of an archetype, in short, a certain 'attribute' of an entity.

The simplest example would look something like this:
```csharp
struct PositionComponent {
  public float x, y, z;
}

struct RotationComponent {
  public float x, y, z;
}

struct ScaleComponent {
  public float x, y, z;
}

struct TransformAspect {
  public PositionComponent position;
  public RotationComponent rotation;
  public ScaleComponent scale;
}
```

At the same time, from the API point of view - it behaves like a component, you can also make selections, spin in systems, filter.
But 'under the hood' it is interpreted as a 'set of components'.

That's all for now, time to pee and sleep. I will stop at each stage in more detail later and examine and measure everything in detail.
