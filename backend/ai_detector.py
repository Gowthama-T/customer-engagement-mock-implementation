"""
CrowdSafe AI - AI Detection Module
YOLOv8-based object detection and crowd analysis
"""

import cv2
import numpy as np
from ultralytics import YOLO
import logging
from typing import List, Dict, Any, Tuple
from .config import settings

logger = logging.getLogger(__name__)

class CrowdDetector:
    def __init__(self):
        self.model = None
        self.initialized = False
        
    def initialize(self):
        """Initialize the YOLO model"""
        try:
            logger.info("Loading YOLO model...")
            self.model = YOLO(settings.yolo_model_path)
            self.initialized = True
            logger.info("✅ YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load YOLO model: {e}")
            self.initialized = False
    
    def detect_objects(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects in the frame"""
        if not self.initialized or self.model is None:
            return []
        
        try:
            # Run inference
            results = self.model(
                frame,
                conf=settings.confidence_threshold,
                iou=settings.iou_threshold,
                verbose=False
            )
            
            detections = []
            
            if results and len(results) > 0:
                result = results[0]
                
                if result.boxes is not None:
                    boxes = result.boxes.xyxy.cpu().numpy()
                    confidences = result.boxes.conf.cpu().numpy()
                    classes = result.boxes.cls.cpu().numpy()
                    
                    for i, (box, conf, cls) in enumerate(zip(boxes, confidences, classes)):
                        x1, y1, x2, y2 = box
                        class_name = self.model.names[int(cls)]
                        
                        detection = {
                            'id': i,
                            'class': class_name,
                            'confidence': float(conf),
                            'bbox': [float(x1), float(y1), float(x2), float(y2)],
                            'center': [float((x1 + x2) / 2), float((y1 + y2) / 2)],
                            'area': float((x2 - x1) * (y2 - y1))
                        }
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Error during object detection: {e}")
            return []
    
    def analyze_crowd(self, frame: np.ndarray, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze crowd density and safety metrics"""
        try:
            # Filter for person detections
            people = [d for d in detections if d['class'] == 'person']
            
            # Calculate frame area
            frame_height, frame_width = frame.shape[:2]
            frame_area = frame_width * frame_height
            
            # Calculate crowd density
            person_count = len(people)
            total_person_area = sum(d['area'] for d in people)
            density = min(total_person_area / frame_area, 1.0) if frame_area > 0 else 0.0
            
            # Calculate safety score (inverse of density with some adjustments)
            safety_score = max(0, 100 - (density * 100))
            
            # Detect potential issues
            issues = []
            
            # Check for overcrowding
            if density > settings.crowd_density_threshold:
                issues.append("High crowd density detected")
            
            # Check for clustering (people too close together)
            if len(people) > 5:
                clusters = self._detect_clusters(people)
                if len(clusters) > 0:
                    issues.append(f"Crowd clustering detected: {len(clusters)} clusters")
                    safety_score -= len(clusters) * 5
            
            # Ensure safety score is within bounds
            safety_score = max(0, min(100, safety_score))
            
            return {
                'person_count': person_count,
                'density': density,
                'safety_score': safety_score,
                'issues': issues,
                'clusters': self._detect_clusters(people) if len(people) > 5 else [],
                'frame_area': frame_area,
                'person_area': total_person_area
            }
            
        except Exception as e:
            logger.error(f"Error analyzing crowd: {e}")
            return {
                'person_count': 0,
                'density': 0.0,
                'safety_score': 100.0,
                'issues': [],
                'clusters': [],
                'frame_area': 0,
                'person_area': 0
            }
    
    def _detect_clusters(self, people: List[Dict[str, Any]], distance_threshold: float = 50.0) -> List[Dict[str, Any]]:
        """Detect clusters of people that are too close together"""
        if len(people) < 2:
            return []
        
        clusters = []
        visited = set()
        
        for i, person1 in enumerate(people):
            if i in visited:
                continue
                
            cluster = [i]
            center1 = person1['center']
            
            for j, person2 in enumerate(people[i+1:], i+1):
                if j in visited:
                    continue
                    
                center2 = person2['center']
                distance = np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                
                if distance < distance_threshold:
                    cluster.append(j)
                    visited.add(j)
            
            if len(cluster) >= 3:  # Consider it a cluster if 3+ people are close
                cluster_centers = [people[idx]['center'] for idx in cluster]
                cluster_center = [
                    sum(c[0] for c in cluster_centers) / len(cluster_centers),
                    sum(c[1] for c in cluster_centers) / len(cluster_centers)
                ]
                
                clusters.append({
                    'people_indices': cluster,
                    'size': len(cluster),
                    'center': cluster_center,
                    'risk_level': min(len(cluster) / 10.0, 1.0)  # Normalize risk
                })
                
                for idx in cluster:
                    visited.add(idx)
        
        return clusters
    
    def draw_detections(self, frame: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """Draw detection bounding boxes and labels on the frame"""
        annotated_frame = frame.copy()
        
        try:
            for detection in detections:
                x1, y1, x2, y2 = detection['bbox']
                class_name = detection['class']
                confidence = detection['confidence']
                
                # Choose color based on class
                if class_name == 'person':
                    color = (0, 255, 0)  # Green for people
                else:
                    color = (255, 0, 0)  # Blue for other objects
                
                # Draw bounding box
                cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                
                # Draw label
                label = f"{class_name}: {confidence:.2f}"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                cv2.rectangle(
                    annotated_frame,
                    (int(x1), int(y1) - label_size[1] - 10),
                    (int(x1) + label_size[0], int(y1)),
                    color,
                    -1
                )
                cv2.putText(
                    annotated_frame,
                    label,
                    (int(x1), int(y1) - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1
                )
            
            # Add crowd analysis overlay
            crowd_data = self.analyze_crowd(frame, detections)
            self._draw_crowd_overlay(annotated_frame, crowd_data)
            
        except Exception as e:
            logger.error(f"Error drawing detections: {e}")
        
        return annotated_frame
    
    def _draw_crowd_overlay(self, frame: np.ndarray, crowd_data: Dict[str, Any]):
        """Draw crowd analysis overlay on the frame"""
        try:
            height, width = frame.shape[:2]
            
            # Prepare overlay text
            overlay_text = [
                f"People: {crowd_data['person_count']}",
                f"Density: {crowd_data['density']:.1%}",
                f"Safety: {crowd_data['safety_score']:.0f}%"
            ]
            
            # Draw background for overlay
            overlay_height = len(overlay_text) * 25 + 10
            cv2.rectangle(frame, (10, 10), (250, overlay_height), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (250, overlay_height), (255, 255, 255), 2)
            
            # Draw text
            for i, text in enumerate(overlay_text):
                y_pos = 30 + i * 25
                cv2.putText(
                    frame,
                    text,
                    (20, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )
            
            # Draw density indicator
            density_color = self._get_density_color(crowd_data['density'])
            cv2.circle(frame, (width - 30, 30), 15, density_color, -1)
            cv2.circle(frame, (width - 30, 30), 15, (255, 255, 255), 2)
            
        except Exception as e:
            logger.error(f"Error drawing crowd overlay: {e}")
    
    def _get_density_color(self, density: float) -> Tuple[int, int, int]:
        """Get color based on crowd density"""
        if density < 0.3:
            return (0, 255, 0)  # Green - low density
        elif density < 0.6:
            return (0, 255, 255)  # Yellow - medium density
        elif density < 0.8:
            return (0, 165, 255)  # Orange - high density
        else:
            return (0, 0, 255)  # Red - critical density