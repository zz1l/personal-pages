---
title: "动态规划"
description: "动态规划配方：最优子结构、重叠子问题，以及把递推式变成表格。附 Python 实例。"
category: "计算机科学"
subcategory: "算法"
tags:
  - 算法
  - 动态规划
  - 复杂性
difficulty: "intermediate"
created: 2025-08-05
updated: 2026-01-10
---

# 动态规划

动态规划（Dynamic Programming，DP）不是某种算法，而是一种*设计范式*：
通过解决更小的实例并组合其答案来解决问题。它适用于具有以下性质的问题：

1. **最优子结构**——最优解由子问题的最优解构成；且
2. **重叠子问题**——同一个子问题被反复需要。

## 两种实现方式

自底向上，按依赖顺序填表：

```python
def fib(n: int) -> int:
    """O(n) 时间，O(1) 空间。"""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

自顶向下加记忆化——先写朴素递归，再加缓存：

```python
from functools import cache

@cache
def fib_memo(n: int) -> int:
    if n < 2:
        return n
    return fib_memo(n - 1) + fib_memo(n - 2)
```

> [!TIP]
> 从递推式入手，之后再优化。一个正确的 $O(2^n)$ 递归加上 `@cache`，
> 通常就是一个正确的多项式算法——而且远比手写表格索引容易写对。

## 0/1 背包

设共有 $n$ 件物品，重量 $w_i$、价值 $v_i$，容量为 $W$，递推式为：

$$
\text{dp}(i, c) =
\begin{cases}
0 & i = 0 \text{ 或 } c = 0 \\
\text{dp}(i-1, c) & w_i > c \\
\max\big(\text{dp}(i-1, c),\ v_i + \text{dp}(i-1, c - w_i)\big) & \text{其他情况}
\end{cases}
$$

```python
def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        for c in range(W, w - 1, -1):  # 0/1 背包需倒序遍历
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[W]
```

倒序遍历是让空间优化版本正确的标准技巧——正序遍历会允许同一件物品被使用两次。

## DP 不适用的场合

- 没有重叠子问题 → 分治（如归并排序）。
- 没有最优子结构 → 例如一般图中的最长路；贪心或搜索仍然可能有效。
- 见 [[图算法]] 中 DAG 上的 DP（拓扑序）与最短路，以及未完成的笔记
  [[计算复杂性理论]] 中这些问题的层级位置。
