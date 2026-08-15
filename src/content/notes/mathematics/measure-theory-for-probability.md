---
title: "概率论中的测度论"
description: "为什么概率论需要测度论：概率空间、σ-代数与可数可加性的病态之处。"
category: "数学"
subcategory: "概率论"
tags:

  - 概率论
  - 测度论
  - 分析
    difficulty: "advanced"
    created: 2025-11-02
    updated: 2025-12-18
---

# 概率论中的测度论

概率论就是总质量为一的测度论。柯尔莫哥洛夫的公理化（1933）把整个概率论
纳入测度与积分的框架——这篇笔记记录为什么这些额外机制是不可避免的。

## 概率空间

一个**概率空间**是三元组 $(\Omega, \mathcal{F}, \mathbb{P})$：

- $\Omega$——样本空间（结果的集合）；
- $\mathcal{F} \subseteq 2^{\Omega}$——**事件**的 $\sigma$-代数；
- $\mathbb{P} : \mathcal{F} \to [0,1]$——可数可加的测度，满足 $\mathbb{P}(\Omega) = 1$。

可数可加性是最关键的公理：

$$
\mathbb{P}\Big(\bigcup_{n=1}^{\infty} A_n\Big) = \sum_{n=1}^{\infty} \mathbb{P}(A_n)
\quad\text{其中 } A_n \text{ 两两不交}.
$$

## 为什么不能直接用 $2^{\Omega}$？

人们或许希望把 $\mathbb{P}$ 定义在 $\Omega$ 的*所有*子集上。两个经典障碍：

1. **维塔利例子**：在 $\Omega = [0,1]$ 上，勒贝格测度无法（在承认选择公理时）
   延拓为 $2^{[0,1]}$ 上的平移不变测度。
2. **可数集上不存在均匀测度**：在 $\mathbb{N}$ 上不存在可数可加的均匀分布——
   可数可加性迫使每个有限集 $A$ 都有 $\mathbb{P}(A) = 0$。

> [!TIP]
> $\sigma$-代数 $\mathcal{F}$ 记录的是*模型能回答哪些问题*。条件化、滤波、
> 停时，都是关于信息结构 $\mathcal{F}_t$ 的陈述，而非关于 $\Omega$ 本身的陈述。

## 随机变量

随机变量 $X$ 是可测映射 $X : \Omega \to \mathbb{R}$；其分布是 $\mathbb{R}$ 上的
前推测度 $X_*\mathbb{P}$。期望就是勒贝格积分：

$$
\mathbb{E}[X] = \int_\Omega X\, d\mathbb{P}
$$

可测性（而非连续性、可计算性）是让理论运转的结构性质：它恰好是前推、极限
与条件期望良定义的条件。

## 收敛之动物园

| 模式 | 定义 | 蕴含 |
| --- | --- | --- |
| 几乎必然 | $\mathbb{P}(X_n \to X) = 1$ | 依概率 |
| $L^p$ | $\mathbb{E}\lvert X_n - X\rvert^p \to 0$ | 依概率 |
| 依概率 | $\mathbb{P}(\lvert X_n - X\rvert > \varepsilon) \to 0$ | 依分布 |
| 依分布 | 对有界连续 $f$，$\mathbb{E}[f(X_n)] \to \mathbb{E}[f(X)]$ | — |

几乎必然收敛是真正测度论式的：若 $\mathcal{F}$ 不完备，逐点极限 $\lim X_n$
甚至可能不可测。
