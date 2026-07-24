# 📡 LiDAR Obstacle Avoidance Simulation & Robotics Workbench

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![ROS 2](https://img.shields.io/badge/ROS%202-Humble%20%2F%20Jazzy-22314E?style=flat&logo=ros&logoColor=white)](https://docs.ros.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, high-performance web application for **LiDAR-based Obstacle Avoidance Algorithms** featuring real-time 2D raycasting, occupancy grid mapping, multiple navigation algorithms (**DWA**, **APF**, **VFH+**, **Tangent Bug**), live telemetry, and hardware-ready **ROS 2 (`rclpy`)** code exports.

---

## 👥 Author & Contributors

- **Abdul Aejas** ([@ABDULAEJAS](https://github.com/ABDULAEJAS)) — Project Creator & Lead Contributor

---

## ✨ Features

- **📡 Multi-Beam LiDAR Sensor Simulation**:
  - Configurable beam count (16 to 360 rays), Field of View ($45^\circ$ to $360^\circ$), and Max Range ($1.0\text{m}$ to $15.0\text{m}$).
  - Realistic Gaussian sensor noise ($\sigma$) & point cloud extraction.
- **🤖 4 Obstacle Avoidance Algorithms**:
  - **Dynamic Window Approach (DWA)**: Velocity-space sampling $(v, \omega)$ with trajectory prediction and obstacle clearance scoring.
  - **Artificial Potential Field (APF)**: Goal attraction potential + repulsive forces from LiDAR scan points with local minima escape perturbation.
  - **Vector Field Histogram (VFH+)**: Polar obstacle density histogram computation and candidate valley steering selection.
  - **Tangent Bug / Bug2**: Motion-to-Goal state machine with Wall-Following mode on obstacle detection.
- **🗺️ Probabilistic Occupancy Grid Mapping**: Real-time 2D log-odds map generated via inverse LiDAR sensor model.
- **📊 60 FPS Telemetry Dashboard**: Live sparkline graphs tracking velocity $v$, yaw rate $\omega$, nearest obstacle clearance $d_{\min}$, and loop frequency.
- **💻 Hardware & ROS 2 Exporter**: Copy-paste ready Python code for ROS 2 nodes (`rclpy`) subscribing to `/scan` (`sensor_msgs/LaserScan`) and publishing `/cmd_vel` (`geometry_msgs/Twist`), plus ESP32 / Arduino C++ drivers.
- **🗺️ Benchmark Scenarios**: Narrow Corridor, U-Trap Local Minima, Dynamic Crowd, Random Forest, Slalom Maze, and Custom Playground with interactive drag-and-drop obstacle tools.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/ABDULAEJAS/Obstacle-avoidance---lidar-project.git
cd Obstacle-avoidance---lidar-project

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Graphics**: HTML5 2D Canvas Engine
- **Icons**: Lucide React
- **Styling**: Vanilla CSS3 (Glassmorphism design tokens & CSS Custom Properties)

---

## 🤖 ROS 2 Node Example

The workbench exports a ready-to-run ROS 2 Node:

```python
#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
import math
import numpy as np
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import Twist

class LidarObstacleAvoidanceNode(Node):
    def __init__(self):
        super().__init__('lidar_obstacle_avoidance')
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.scan_sub = self.create_subscription(LaserScan, '/scan', self.scan_cb, 10)
        
    def scan_cb(self, msg):
        ranges = np.nan_to_num(msg.ranges, posinf=msg.range_max)
        min_dist = np.min(ranges)
        
        cmd = Twist()
        if min_dist < 0.4:
            cmd.angular.z = 1.5  # Emergency turn
        else:
            cmd.linear.x = 0.8  # Drive forward
        self.cmd_pub.publish(cmd)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
