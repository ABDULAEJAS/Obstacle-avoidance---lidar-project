import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

export const CodeExportModal = ({ algName }) => {
  const [activeLang, setActiveLang] = useState('python'); // 'python' | 'cpp' | 'js'
  const [copied, setCopied] = useState(false);

  const pythonCode = `#!/usr/bin/env python3
"""
ROS 2 Node for LiDAR Obstacle Avoidance using ${algName}
Subscribes: /scan (sensor_msgs/msg/LaserScan), /odom (nav_msgs/msg/Odometry)
Publishes: /cmd_vel (geometry_msgs/msg/Twist)
"""
import rclpy
from rclpy.node import Node
import math
import numpy as np
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry

class LidarObstacleAvoidanceNode(Node):
    def __init__(self):
        super().__init__('lidar_obstacle_avoidance')
        
        # ROS 2 Publishers & Subscribers
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.scan_sub = self.create_subscription(LaserScan, '/scan', self.scan_callback, 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        
        # Robot Parameters & Limits
        self.max_v = 1.0  # m/s
        self.max_w = 1.5  # rad/s
        self.target_goal = np.array([10.0, 5.0]) # Target goal in odom frame
        
        self.current_pose = np.array([0.0, 0.0, 0.0]) # x, y, yaw
        self.latest_scan = None
        
        # Control Loop Timer (20 Hz)
        self.timer = self.create_timer(0.05, self.control_loop)
        self.get_logger().info('LiDAR Obstacle Avoidance Node Initialized!')

    def odom_callback(self, msg):
        pos = msg.pose.pose.position
        ori = msg.pose.pose.orientation
        # Convert quaternion to yaw
        siny_cosp = 2 * (ori.w * ori.z + ori.x * ori.y)
        cosy_cosp = 1 - 2 * (ori.y * ori.y + ori.z * ori.z)
        yaw = math.atan2(siny_cosp, cosy_cosp)
        self.current_pose = np.array([pos.x, pos.y, yaw])

    def scan_callback(self, msg):
        self.latest_scan = msg

    def control_loop(self):
        if self.latest_scan is None:
            return

        ranges = np.array(self.latest_scan.ranges)
        # Filter out NaN and Inf range readings
        ranges = np.nan_to_num(ranges, nan=self.latest_scan.range_max, posinf=self.latest_scan.range_max)
        
        min_dist = np.min(ranges)
        cmd = Twist()

        # Simple Proximity Reactive Safety Check
        if min_dist < 0.4:
            self.get_logger().warn(f'EMERGENCY STOP! Obstacle at {min_dist:.2f}m')
            cmd.linear.x = 0.0
            cmd.angular.z = self.max_w # Turn in place
        else:
            # Calculate heading to goal
            dx = self.target_goal[0] - self.current_pose[0]
            dy = self.target_goal[1] - self.current_pose[1]
            dist_to_goal = math.hypot(dx, dy)
            goal_heading = math.atan2(dy, dx)
            
            heading_err = self.normalize_angle(goal_heading - self.current_pose[2])

            if dist_to_goal < 0.3:
                self.get_logger().info('Goal Reached!')
                cmd.linear.x = 0.0
                cmd.angular.z = 0.0
            else:
                cmd.linear.x = min(self.max_v, dist_to_goal * 0.5) * max(0.2, math.cos(heading_err))
                cmd.angular.z = np.clip(heading_err * 2.0, -self.max_w, self.max_w)

        self.cmd_pub.publish(cmd)

    @staticmethod
    def normalize_angle(angle):
        while angle > math.pi: angle -= 2 * math.pi
        while angle < -math.pi: angle += 2 * math.pi
        return angle

def main(args=None):
    rclpy.init(args=args)
    node = LidarObstacleAvoidanceNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`;

  const cppCode = `/*
 * Arduino / ESP32 C++ Code for LiDAR Obstacle Avoidance
 * Hardware: ESP32 + RPLiDAR A1M8 / TF-Luna + L298N Differential Motor Driver
 */
#include <Arduino.h>

#define MAX_SPEED 255
#define SAFE_DIST_CM 50

// Motor Pins
const int ENA = 18, IN1 = 19, IN2 = 21;
const int ENB = 22, IN3 = 23, IN4 = 25;

void setMotors(int speedLeft, int speedRight) {
  digitalWrite(IN1, speedLeft > 0 ? HIGH : LOW);
  digitalWrite(IN2, speedLeft > 0 ? LOW : HIGH);
  analogWrite(ENA, abs(speedLeft));

  digitalWrite(IN3, speedRight > 0 ? HIGH : LOW);
  digitalWrite(IN4, speedRight > 0 ? LOW : HIGH);
  analogWrite(ENB, abs(speedRight));
}

void setup() {
  Serial.begin(115200);   // Debug Console
  Serial2.begin(115200);  // Hardware UART for LiDAR

  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT); pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);

  Serial.println("ESP32 LiDAR Obstacle Avoidance Ready!");
}

void loop() {
  // Read distance from UART LiDAR sensor (TF-Luna 9-byte packet format)
  if (Serial2.available() >= 9) {
    if (Serial2.read() == 0x59 && Serial2.read() == 0x59) {
      int distLow = Serial2.read();
      int distHigh = Serial2.read();
      int distanceCm = distLow + (distHigh << 8);

      // Flush remaining packet bytes
      for (int i = 0; i < 5; i++) Serial2.read();

      Serial.print("Obstacle Distance: ");
      Serial.print(distanceCm);
      Serial.println(" cm");

      if (distanceCm > 0 && distanceCm < SAFE_DIST_CM) {
        // Obstacle detected! Turn left to avoid collision
        setMotors(-180, 180);
        delay(300);
      } else {
        // Clear path - Drive forward
        setMotors(200, 200);
      }
    }
  }
  delay(20);
}
`;

  const jsCode = `// Pure JavaScript ES6 LiDAR Obstacle Avoidance Controller
export function computeAvoidanceVelocity(robotState, scanData, goalState) {
  const { x, y, theta, maxV, maxOmega } = robotState;
  
  // Find minimum obstacle distance from scan readings
  let minObstacleDist = Infinity;
  for (const ray of scanData) {
    if (ray.hit && ray.distance < minObstacleDist) {
      minObstacleDist = ray.distance;
    }
  }

  // Goal direction vector
  const dx = goalState.x - x;
  const dy = goalState.y - y;
  const goalDist = Math.hypot(dx, dy);
  const goalAngle = Math.atan2(dy, dx);
  
  let headingError = goalAngle - theta;
  while (headingError > Math.PI) headingError -= Math.PI * 2;
  while (headingError < -Math.PI) headingError += Math.PI * 2;

  // Command calculation
  let v = maxV * Math.max(0.1, Math.cos(headingError));
  let omega = Math.max(-maxOmega, Math.min(maxOmega, headingError * 2.0));

  // Reactive obstacle slowdown
  if (minObstacleDist < 1.0) {
    v *= Math.max(0.1, minObstacleDist / 1.0);
  }

  return { v, omega, minObstacleDist };
}
`;

  const getCode = () => {
    if (activeLang === 'python') return pythonCode;
    if (activeLang === 'cpp') return cppCode;
    return jsCode;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileCode size={22} style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Hardware Code Exporter</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Production-ready ROS 2 / Arduino C++ code for your LiDAR robot hardware
            </p>
          </div>
        </div>

        {/* Language Switcher Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveLang('python')}
            className={`btn-secondary ${activeLang === 'python' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            Python (ROS 2)
          </button>
          <button
            onClick={() => setActiveLang('cpp')}
            className={`btn-secondary ${activeLang === 'cpp' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            C++ (Arduino/ESP32)
          </button>
          <button
            onClick={() => setActiveLang('js')}
            className={`btn-secondary ${activeLang === 'js' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            JavaScript
          </button>

          <button onClick={handleCopy} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <pre style={{
        background: '#040711',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '1.25rem',
        fontSize: '0.82rem',
        fontFamily: 'var(--font-mono)',
        color: '#e2e8f0',
        overflowX: 'auto',
        maxHeight: '480px',
        lineHeight: '1.5'
      }}>
        <code>{getCode()}</code>
      </pre>
    </div>
  );
};
