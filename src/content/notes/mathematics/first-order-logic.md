---
title: "一阶逻辑"
description: "一阶逻辑的语法、语义与关键元定理——现代数学的通用语言。"
category: "数学"
subcategory: "逻辑"
tags:
  - 逻辑
  - 数理逻辑
  - 模型论
status: "evergreen"
difficulty: "advanced"
created: 2025-09-12
updated: 2026-01-14
---

# 一阶逻辑

一阶逻辑（First-Order Logic，FOL）是数学的默认形式语言：它足以公理化我们所关心的大多数理论，又弱到其元理论仍可驾驭。这篇笔记收集了我反复用到的定义。

## 语法

一个**符号表（signature）** $\sigma = (\mathcal{F}, \mathcal{R})$ 由一组函数符号和关系符号组成，每个符号带有一个元数。项与公式由变元、逻辑联结词 $\neg, \land, \lor, \to$、量词 $\forall, \exists$ 以及等号 $=$ 递归构建。

一个**句子（sentence）**是不含自由变元的公式。

> [!NOTE]
> 等号是逻辑符号，而不是符号表中的关系符号。结构总是把 $=$ 解释为真正的相等关系。

## 语义

一个 $\sigma$-结构 $\mathcal{M}$ 由一个非空论域 $M$ 以及每个符号的解释
$f^{\mathcal{M}} : M^n \to M$、$R^{\mathcal{M}} \subseteq M^n$ 组成。

真值按公式的结构递归定义，其中量词子句为：

$$
\mathcal{M} \models \forall x\, \varphi(x) \iff \text{对每个 } a \in M,\ \mathcal{M} \models \varphi(a)
$$

理论 $T$ 是一组句子；$\mathcal{M} \models T$ 表示 $T$ 中的每个句子都在 $\mathcal{M}$ 中成立。

## 关键元定理

| 定理 | 表述（梗概） |
| --- | --- |
| [[哥德尔完备性定理]] | $T \models \varphi \iff T \vdash \varphi$ |
| 紧致性定理 | $T$ 有模型当且仅当其每个有限子集都有模型 |
| [[哥德尔不完备定理]] | 任何一致且递归公理化的算术扩展都是不完备的 |
| 勒文海姆–斯科伦定理 | 有无限模型的理论在任意无穷基数上都有模型 |

紧致性定理是干活的主力：它直接从完备性定理推出，并允许非标准构造——非标准算术与分析模型就是典型例子。[^1]

## 为什么是一阶而非二阶？

二阶逻辑表达力更强（它可以刻画 $\mathbb{N}$ 直至同构），但代价是元理论性质的灾难性丧失：它没有完备、紧致或勒文海姆–斯科伦式的理论。一阶逻辑恰好处于甜点区——见 [[哥德尔完备性定理]] 中使这一点精确化的陈述。

[^1]: 非标准分析的经典参考文献是 Robinson（1966）的 *Non-standard Analysis*，其工作完全在一阶逻辑内部进行，经由紧致性定理。
