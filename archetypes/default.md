---
title: "{{ replace .Name "-" " " | replaceRE "^([0-9]+) " "" | title }}"
slug: {{ .Name | urlize | replaceRE "^([0-9]+)-" "" }}
date: {{ .Date }}
draft: false
description: 
noindex: false
featured: false
pinned: false
# comments: false
series:
#  - 
categories:
#  - 
tags:
#  - 
images:
#  - 001.webp
---

Content.
