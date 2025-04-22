---
layout: doc
lang: en-US
title: 1.5 AoS vs SoA
description: Layout data for efficient iteration/changes.
logo: /posts/ecs/5/logo.jpg
date: 2024-10-06 00:00:00
tags:
  - ecs
prev:
  link: '/posts/ecs/4'
next:
  text: All ECS Posts
  link: '/posts/ecs'
---
# {{ $frontmatter.title }}

## Introduction

First, let's understand what it is, why it's needed, and how to use it. Let's go.

This post mainly relates to archetype ECS, which I briefly mentioned earlier and didn't focus on because the topic is quite extensive. However, it is not limited to them and generally applies to processing linear data structures.

::: warning

The hybrid is implemented through unsafe simply because C# is not C++, and you can't just layout arrays of custom data structures.

:::

## SoA

**SoA**, or literally **Struct of Arrays**, is an approach where each structure element is stored as an array. This approach applies to all sparse-set ECS, as well as those archetype ECS where components within an archetype are stored in separate arrays.

Roughly speaking, it looks like this:

```csharp
struct Component1 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

struct Component2 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

struct Component3 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

public struct Data {
    private Component1[] comp1;
    private Component2[] comp2;
    private Component3[] comp3;
    // ...

    // there may also be some code processing all this.
}
```

Simple, native, understandable, convenient. Remember, we consider all this in the context of **data processing**, not the implementation of ECS, so let's assume all components are significant, and others won't get there.

Negative points:
- When adding/removing elements, you must monitor sizes and resize **all** arrays, i.e., the more arrays there are, the more resizes you have.
- When adding/removing an element, data must be moved in all arrays, i.e., it's also not an atomic operation.
- Iterations will have more cache misses because managed arrays will be allocated in different memory locations (unless you have a custom allocator).

The code for iterating over such data will look like this:

```csharp
void ForEach() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
    }
}
```

Also simple and clear, we'll get back to the speed of such code later, overall it's pretty good.

It's also worth noting that with this approach, combining works well, allowing you to use only what's needed:

```csharp
void ForEach2() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
        data[i].c2.Value++; // or any other useful operation
    }
}

void ForEach3() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
        data[i].c2.Value++; // or any other useful operation
        data[i].c3.Value++; // or any other useful operation
    }
}
```

> Notice that there are no references to any array fields except those that are needed.

## AoS

Everything is the same as SoA, but vice versa. Even closer to classic OOP - we have one array, the elements of which are structures:

```csharp
struct Component1 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

struct Component2 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

struct Component3 {
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

public struct Data {
    struct Block {
        public Component1 c1;
        public Component2 c2;
        public Component3 c3;
        // ...
    }

    private Block[] data;

    // there may also be some code processing all this.
}
```

Negative points include:
- Manually writing is convenient, but writing an array of dynamic tuples or a block layout will be difficult - it'll be either a generic hell, code generation, or unmanaged code with memory section reinterpretation. The main problem is that fields are needed.
- Iterating over such an array (especially when there are many heavy components) will be significantly slower than the SoA version because, with each index reference, the whole batch of structures will be loaded into the cache.

Iteration over such an array will look like this:

```csharp
void ForEach1() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
    }
}

void ForEach2() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
        data[i].c2.Value++; // or any other useful operation
    }
}

void ForEach3() {
    var n = Count;
    for (var i = 0; i < n; i++) {
        data[i].c1.Value++; // or any other useful operation
        data[i].c2.Value++; // or any other useful operation
        data[i].c3.Value++; // or any other useful operation
    }
}
```

In general, it's also quite convenient, except for the previously mentioned downsides.

This approach will work well when more than half of the content is needed because it minimizes the number of array element accesses.

Also, now there is only one place where it exists, but for this, we pay by having to pull the entire block into the cache - this will be seen in benchmarks.

## Hybrid

The hybrid is an approach designed to take the best from each of the above methods and not drag their downsides into it.

The essence is to store data linearly like in SoA but break the array into small pieces to prevent the prefetcher from pulling unnecessary components into the cache or dragging a huge array tail.

In C++, it will work great with vectors, but in C# you have to fiddle with it. Due to language features, the developer has no simple tools to control the layout of elements in memory.

> I deliberately don't experiment with ints, which can be fiddled with, precisely for the transparency of the problems.

Essentially, it is SoA inside AoS in chunks of `N` elements.

```csharp
public struct Component1 {
    public const int Size = sizeof(int) * 4; // already additional code in the form of constants, increasing the cognitive complexity of the code + potential for mistakes
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

public struct Component2 {
    public const int Size = sizeof(int) * 4;
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

public struct Component3 {
    public const int Size = sizeof(int) * 4;
    public int Value;
    public int Value1; // for padding
    public int Value2; // for padding
    public int Value3; // for padding
}

// ...

private const int BlockSize = 32; // same with constants in components. This one, in particular, controls the block size

// this whole layout is the main bane of C# - unions and the ability to declare array fields of more than primitives would be highly desirable
[StructLayout(LayoutKind.Explicit, Size = (Component1.Size + Component2.Size + Component3.Size /* ... */) * BlockSize)]
public struct Block {
    [FieldOffset(0)]
    public Component1 с1;
    [FieldOffset(Component1.Size * BlockSize)] // each field is declared as the zero element + assumed that a "tail" of another 32 such follows
    public Component2 c2;
    [FieldOffset((Component1.Size + Component2.Size) * BlockSize)]
    public Component3 c3;
    // ...
}

public struct Data {
    private Block[] blocks;

    // there may also be some code processing all this.
}
```

There was a nesting of types, allocations of multiple arrays, the array of blocks itself needed to be initialized, and in general, there was more code.

It also has some cons:
- Cognitive complexity: reading and debugging such code becomes significantly more difficult
- Management and structural changes require more code and therefore more operations
- The iteration code becomes more complex

Iteration follows suit and will look something like this:

> Mini spoiler: after trying different options, including just pointers and a bunch of safe and unsafe, etc., I settled on this, as it seems the most optimal and clear to me.

```csharp
unsafe void ForEach1()
{
    var n = Count / BlockSize;
    var i = 0;
    for (; i < n; i++)
    {
        ref var block = ref blocks[i];
        Iterate(ref block, BlockSize);
    }

    var v = Count % BlockSize;
    ref var lastBlock = ref blocks[i];
    Iterate(ref lastBlock, v);
    return;

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    unsafe void Iterate(ref Block block, in int n) {
        fixed (Component1* p1 = &block.c1) {
            var rc1 = p1;
            for (var j = 0; j < n; j++) {
                rc1->Value++; // or any other useful payload
                rc1++;
            }
        }
    }
}

unsafe void ForEach2()
{
    var n = Count / BlockSize;
    var i = 0;
    for (; i < n; i++)
    {
        ref var block = ref blocks[i];
        Iterate(ref block, BlockSize);
    }

    var v = Count % BlockSize;
    ref var lastBlock = ref blocks[i];
    Iterate(ref lastBlock, v);
    return;

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    unsafe void Iterate(ref Block block, in int n)
    {
        fixed (Component1* p1 = &block.c1)
        fixed (Component2* p2 = &block.c2)
        {
            var rc1 = p1;
            var rc2 = p2;
            for (var j = 0; j < n; j++) {
                rc1->Value++; // or any other useful payload
                rc2->Value++; // or any other useful payload
                rc1++;
                rc2++;
            }
        }
    }
}

unsafe void ForEach3() {
    var n = Count / BlockSize;
    var i = 0;
    for (; i < n; i++)
    {
        ref var block = ref blocks[i];
        Iterate(ref block, BlockSize);
    }

    var v = Count % BlockSize;
    ref var lastBlock = ref blocks[i];
    Iterate(ref lastBlock, v);
    return;

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    unsafe void Iterate(ref Block block, in int n)
    {
        fixed (Component1* p1 = &block.c1)
        fixed (Component2* p2 = &block.c2)
        fixed (Component3* p3 = &block.c3)
        {
            var rc1 = p1;
            var rc2 = p2;
            for (var j = 0; j < n; j++) {
                rc1->Value++; // or any other useful payload
                rc2->Value++; // or any other useful payload
                rc3->Value++; // or any other useful payload
                rc1++;
                rc2++;
                rc3++;
            }
        }
    }
}
```

Terrible, terrible code, with nesting, pointers, and other not very pretty things. Below, in numbers, we will see how this affects processing speed.

It can always be restructured and generalized, or even handed over to code generation. It's up to you.

## So, what to use after all?

I wouldn't be myself if I didn't measure which of these is faster.

> Measurements were taken on M1Max, with 4 integer fields in all components to create a load on the prefetcher.
>
> `Step[N]` means iteration over 1, 2, 3, etc. components within a single pass.
>
> Number of elements 1kk (one million).

> In the table below, the winner is highlighted in green, the loser in red, and the middle is not highlighted.

::: code-group

```csharp[AoS]
| Type   | Method | Count    | Mean         | Error     | StdDev    |
|------- |------- |--------- |-------------:|----------:|----------:|
| AoS    | Step1  | 10000000 |    35.162 ms | 0.2250 ms | 0.1488 ms | // [!code --]
| AoS    | Step2  | 10000000 |    31.674 ms | 0.6115 ms | 0.4045 ms |
| AoS    | Step3  | 10000000 |    33.846 ms | 0.5115 ms | 0.3044 ms |
| AoS    | Step4  | 10000000 |    35.002 ms | 0.3747 ms | 0.2478 ms |
| AoS    | Step5  | 10000000 |    37.280 ms | 0.4044 ms | 0.2675 ms | // [!code ++]
| AoS    | Step6  | 10000000 |    37.641 ms | 0.4709 ms | 0.3115 ms | // [!code ++]
| AoS    | Step7  | 10000000 |    39.376 ms | 0.2620 ms | 0.1733 ms | // [!code ++]
| AoS    | Step8  | 10000000 |    39.791 ms | 0.2997 ms | 0.1567 ms | // [!code ++]
| AoS    | Step9  | 10000000 |    40.939 ms | 0.6126 ms | 0.4052 ms | // [!code ++]
| AoS    | Step10 | 10000000 |    42.324 ms | 0.8813 ms | 0.5245 ms | // [!code ++]
| AoS    | Step11 | 10000000 |    42.589 ms | 0.4914 ms | 0.2924 ms | // [!code ++]
| AoS    | Step12 | 10000000 |    44.138 ms | 0.5851 ms | 0.3870 ms | // [!code ++]
| AoS    | Step13 | 10000000 |    45.769 ms | 0.6103 ms | 0.4037 ms | // [!code ++]
| AoS    | Step14 | 10000000 |    47.140 ms | 0.8175 ms | 0.5407 ms | // [!code ++]
| AoS    | Step15 | 10000000 |    46.995 ms | 0.2223 ms | 0.1470 ms | // [!code ++]
| AoS    | Step16 | 10000000 |    48.818 ms | 0.3407 ms | 0.2028 ms | // [!code ++]
| AoS    | Step17 | 10000000 |    49.678 ms | 0.3939 ms | 0.2606 ms | // [!code ++]
| AoS    | Step18 | 10000000 |    52.187 ms | 0.2884 ms | 0.1908 ms | // [!code ++]
| AoS    | Step19 | 10000000 |    53.463 ms | 0.1817 ms | 0.1202 ms | // [!code ++]
| AoS    | Step20 | 10000000 |    54.774 ms | 0.2482 ms | 0.1298 ms | // [!code ++]
```

```csharp[SoA]
| Type   | Method | Count    | Mean         | Error     | StdDev    |
|------- |------- |--------- |-------------:|----------:|----------:|
| SoA    | Step1  | 10000000 |     6.267 ms | 0.0414 ms | 0.0274 ms | // [!code ++]
| SoA    | Step2  | 10000000 |    11.904 ms | 0.0133 ms | 0.0070 ms | // [!code ++]
| SoA    | Step3  | 10000000 |    19.064 ms | 0.1273 ms | 0.0842 ms | // [!code ++]
| SoA    | Step4  | 10000000 |    30.275 ms | 0.0571 ms | 0.0340 ms | // [!code ++]
| SoA    | Step5  | 10000000 |   238.250 ms | 0.2649 ms | 0.1752 ms | // [!code --]
| SoA    | Step6  | 10000000 |   424.348 ms | 0.2432 ms | 0.1272 ms | // [!code --]
| SoA    | Step7  | 10000000 |   622.912 ms | 1.0963 ms | 0.6524 ms | // [!code --]
| SoA    | Step8  | 10000000 |   828.956 ms | 0.5696 ms | 0.3768 ms | // [!code --]
| SoA    | Step9  | 10000000 |   877.664 ms | 2.9837 ms | 1.9735 ms | // [!code --]
| SoA    | Step10 | 10000000 | 1,145.340 ms | 1.3835 ms | 0.9151 ms | // [!code --]
| SoA    | Step11 | 10000000 | 1,202.752 ms | 3.9214 ms | 2.5938 ms | // [!code --]
| SoA    | Step12 | 10000000 | 1,141.439 ms | 2.9407 ms | 1.9451 ms | // [!code --]
| SoA    | Step13 | 10000000 | 1,520.562 ms | 1.6564 ms | 1.0956 ms | // [!code --]
| SoA    | Step14 | 10000000 | 1,761.528 ms | 1.5312 ms | 1.0128 ms | // [!code --]
| SoA    | Step15 | 10000000 | 1,855.929 ms | 1.7290 ms | 1.1436 ms | // [!code --]
| SoA    | Step16 | 10000000 | 1,830.698 ms | 1.3030 ms | 0.8619 ms | // [!code --]
| SoA    | Step17 | 10000000 | 1,679.585 ms | 1.3195 ms | 0.7852 ms | // [!code --]
| SoA    | Step18 | 10000000 | 1,619.472 ms | 1.6495 ms | 1.0910 ms | // [!code --]
| SoA    | Step19 | 10000000 | 1,973.583 ms | 8.6983 ms | 5.1762 ms | // [!code --]
| SoA    | Step20 | 10000000 | 2,293.830 ms | 1.6763 ms | 0.9975 ms | // [!code --]
```

```csharp[Hybrid]
| Type   | Method | Count    | Mean         | Error     | StdDev    |
|------- |------- |--------- |-------------:|----------:|----------:|
| Hybrid | Step1  | 10000000 |    30.764 ms | 0.3450 ms | 0.1805 ms |
| Hybrid | Step2  | 10000000 |    40.182 ms | 0.3125 ms | 0.2067 ms | // [!code --]
| Hybrid | Step3  | 10000000 |    50.265 ms | 0.1783 ms | 0.1061 ms | // [!code --]
| Hybrid | Step4  | 10000000 |    51.241 ms | 0.2616 ms | 0.1730 ms | // [!code --]
| Hybrid | Step5  | 10000000 |    76.930 ms | 0.9220 ms | 0.6099 ms |
| Hybrid | Step6  | 10000000 |    83.634 ms | 0.2978 ms | 0.1557 ms |
| Hybrid | Step7  | 10000000 |    89.111 ms | 0.7560 ms | 0.4499 ms |
| Hybrid | Step8  | 10000000 |    93.006 ms | 0.5081 ms | 0.3361 ms |
| Hybrid | Step9  | 10000000 |   101.911 ms | 1.5217 ms | 1.0065 ms |
| Hybrid | Step10 | 10000000 |   108.056 ms | 2.6164 ms | 1.7306 ms |
| Hybrid | Step11 | 10000000 |   119.447 ms | 1.8171 ms | 1.0813 ms |
| Hybrid | Step12 | 10000000 |   116.118 ms | 6.6427 ms | 4.3938 ms |
| Hybrid | Step13 | 10000000 |   109.516 ms | 1.0092 ms | 0.6005 ms |
| Hybrid | Step14 | 10000000 |   121.404 ms | 1.8718 ms | 1.2381 ms |
| Hybrid | Step15 | 10000000 |   117.430 ms | 6.6916 ms | 3.9821 ms |
| Hybrid | Step16 | 10000000 |   120.022 ms | 4.9221 ms | 3.2556 ms |
| Hybrid | Step17 | 10000000 |    91.136 ms | 0.6531 ms | 0.4320 ms |
| Hybrid | Step18 | 10000000 |    85.625 ms | 0.4673 ms | 0.3091 ms |
| Hybrid | Step19 | 10000000 |    96.137 ms | 3.2057 ms | 2.1204 ms |
| Hybrid | Step20 | 10000000 |    98.116 ms | 1.9292 ms | 1.2760 ms |
```

:::

> You can view the code [here](https://github.com/blackbone/ecs/tree/main/bench2).

So, the conclusions:

- When iterating over up to 5 components, AoS loses. This is due to the fact that with SoA, the prefetcher pulls more valid data into the cache. The hybrid loses even more because of the overhead on iteration.
- When iterating over 5+ components, AoS and hybrid win. This is because with SoA, the prefetcher pulls new data into the cache, overwriting the previous ones (which would be relevant in the next iteration). The same happens with the hybrid.
- The performance degradation curve in the case of AoS is smoother, even though SoA outperforms it in relatively "simple" iterations. In perspective (or in the "average" case), AoS will be more efficient when iterating (!).
- The hybrid's numbers fluctuate quite a bit, tending to decrease with increased operation complexity - perhaps I'm just clumsy.

In a nutshell: ***If the system operates with one or two components, it is more efficient to use SoA; if 5+, then AoS***. Although the gain is almost 50%, in terms of execution time, it can be sacrificed for the sake of maintaining a uniform approach. It makes sense to use the hybrid if you have C++ and can implement such constructions natively (or if you're more skilled than I am).

> Just a reminder that we are currently considering exclusively a **set of significant data**, meaning all the above should be interpreted strictly in the context of a single archetype.

## Conclusions

The conclusion is that the reader now understands the impact of data layout on processing speed. It is hard to identify an absolute favorite, as different tasks have different amounts of data and processing requirements.

Simply select the right tool and approach for each specific case.

## ECS Disclaimer

In the context of ECS, the price of fast iteration is the high cost of structural changes. With "thick" entities (read - data sets), adding or removing a single component, even when using [Remove and Swap Back](/posts/ecs/4/#remove-and-swap-back), which I wrote about earlier, will be quite resource-intensive and slower than sparse-set solutions.

Using SoA processing makes sense, IMHO, in situations where the components of an archetype are not connected to each other or are connected indirectly with minimal intersections within processing logic.