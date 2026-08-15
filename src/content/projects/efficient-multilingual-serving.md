---
title: "高效多语言 LLM 推理"
description: "探索性项目：降低开放权重大模型的多语言推理开销（分词器膨胀、KV 缓存压力）。"
status: "idea"
tech: ["Python", "CUDA", "vLLM"]
year: 2026
---

早期构想。假设是：词表与缓存压力随语言数量增长，其中大部分可以通过服务时的
语言自适应分词避免。
