# Install prompt — paste this to your Hermes Agent

The whole "installation" for a student is: copy one of these messages and send it to
their own Hermes Agent. Hermes runs the command itself, installs the skill, and confirms.
No SSH, no terminal knowledge needed.

> Replace `YOUR_GH` with the real GitHub repo once it's published.

---

## 中文（发给你的 Hermes）

```
请帮我安装 Sitesmith 建站技能（skill）。请在终端运行这条命令来安装：

curl -fsSL https://raw.githubusercontent.com/YuukiMarine/websiteskills/main/remote-install.sh | bash

装好后，确认 “sitesmith” 出现在你的 skills 列表里，并告诉我。
之后我会让你“帮我建一个网站”。
```

## English (send to your Hermes)

```
Please install the Sitesmith website-builder skill. Run this in the terminal:

curl -fsSL https://raw.githubusercontent.com/YuukiMarine/websiteskills/main/remote-install.sh | bash

Once it finishes, confirm "sitesmith" appears in your skills list and tell me.
Then I'll ask you to "build me a website".
```

---

## Notes

- The student's server must already run **Hermes Agent** (a Tencent Cloud HK/SG image
  with it pre-installed, or the official Hermes installer) plus **Node 22** and **git**.
- After install, point Hermes at GLM-5.1 (`hermes model` → Custom endpoint →
  `https://api.z.ai/api/coding/paas/v4`), then chat: "build me a website for …".
- The deploy assistant (innoe.io sub-page) wraps this prompt in a guided, step-by-step
  flow with a copy button + progress — this file is the raw payload it hands out.
