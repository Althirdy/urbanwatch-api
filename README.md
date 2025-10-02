# UrbanWatch 🚨  

**UrbanWatch** is an AI-powered real-time accident detection and incident concern reporting platform designed for Brgy 176.  

The system integrates **CCTV cameras** and **AI models** to automatically detect incidents such as car accidents, fires, floods, and medical emergencies.  
In addition to CCTV-based monitoring, **IoT sensors** (sound, vibration, and environmental) enhance detection by capturing anomalies that may not be visible in camera feeds.  

This repository contains the **Laravel (backend)** and **Inertia.js with React (frontend)** codebase.  
We use **ddev** for local development to ensure a consistent environment for all developers.  

---

## 📖 Project Context  

Urban communities face major challenges in ensuring timely responses to accidents and emergencies.  
Currently, CCTV operators manually monitor camera feeds, which can lead to delayed recognition and slower response times.  

**UrbanWatch** addresses this issue by combining **AI-driven video analytics**, **IoT sensors**, and **incident reporting** into a single platform.  
This allows for **faster detection, quicker validation, and timely response** by local authorities.  

---

## ⚡ Tech Stack

- **Backend:** Laravel  
- **Frontend:** Inertia.js + React  
- **Database:** MySQL  
- **Environment:** ddev (Docker-based)  
- **Optional Tools:** phpMyAdmin for database management  

---

## 🚀 Getting Started with ddev

Follow these steps to set up the project on your local machine:  

### 1. Install Requirements
Make sure you have:  
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)  
- [ddev](https://ddev.readthedocs.io/en/stable/)  

Clone this repository:  
git clone [https://github.com/your-org/urbanwatch.git](https://github.com/Althirdy/inertia-api.git)
cd inertia-api

### 2. Running the Command
- chmod +x setup.sh
- sudo ./setup.sh

### 3. Open new Terminal
to see running containers
- ddev describe




