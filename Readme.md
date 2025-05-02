# **TabZen - Intelligent Tab Management**  
*A powerful browser extension for smarter, cleaner, and more productive tab workflows.*

![TabZen Interface - Dark Theme](screenshots/interface-dark.png)  
<sub>✨ Light and dark mode with semantic tab grouping support</sub>

---

## 🚀 Features

### 🧠 Smart Tab Organization
| Feature              | Description                                                                  |
|---------------------|------------------------------------------------------------------------------|
| **Auto-Categorization** | Automatically group tabs into categories (Work, Social, Shopping, etc.)     |
| **Semantic Analysis**   | Context-aware grouping using URL and title metadata                         |
| **Custom Rules**        | Define your own grouping logic with customizable priorities                |

### 🎨 Visual Management
| Feature              | Description                                                                  |
|---------------------|------------------------------------------------------------------------------|
| **Color Coding**       | Apply custom colors to groups and categories                               |
| **Dual Themes**        | Easily toggle between light and dark modes                                 |
| **Activity Tracking**  | See real-time tab activity via visual indicators                           |

### ⚙️ Productivity Tools
| Feature                | Description                                                              |
|------------------------|--------------------------------------------------------------------------|
| **Cross-Window Search** | Search tabs across all browser windows                                   |
| **Bulk Actions**         | Group, ungroup, close, or save tab sets with one click                  |

### 🔬 Advanced Features
| Feature                  | Description                                                            |
|--------------------------|------------------------------------------------------------------------|
| **Inactivity Detection**   | Highlight tabs based on user inactivity                              |
| **Custom Groups**         | Manually create and manage your own tab collections                   |

---

## 💻 Installation

### 🔧 From Source
1. Download Zip and Extract

**To Load in Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `/root` folder

> 🛍️ **Chrome Web Store:** *Coming soon!*

---

## 🧭 Usage Guide

### 🔧 Basic Controls

| Action         | Shortcut                            |
|----------------|-------------------------------------|
| Toggle Popup   | `Ctrl` / `⌘` + `Shift` + `Z`       |
| Toggle Theme   | Click theme icon (🌙 / ☀️)         |
| Search Tabs    | `Ctrl` / `⌘` + `Shift` + `Space`   |
| Create Group   | Select tabs + Click on Organize Tabs|
| Ungroup Tabs   | Click option → *Ungroup*            |


### 🧩 Group Management

**Auto Grouping:**  
Click **Organize Tabs** to categorize automatically.  
Adjust sensitivity in **Advanced Settings → Auto-Grouping**.

**Custom Groups:**
```json
{
  "name": "Project Aurora",
  "color": "purple",
  "tabs": [
    "https://github.com/aurora",
    "https://docs.aurora.dev"
  ]
}
```

---

## 💬 Support

Found a bug? Have a feature request?  
👉 [Open an issue](https://github.com/yourusername/tabzen/issues)

---

## 📄 License

**MIT License**  
See [LICENSE](LICENSE) for full details.

> 🛡️ **Privacy Notice:** TabZen processes **all data locally**. It does **not transmit** any user data externally.
