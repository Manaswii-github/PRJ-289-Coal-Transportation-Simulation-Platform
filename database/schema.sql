-- DIGITAL PLATFORM FOR MULTIMODAL VISIBILITY OF COAL TRANSPORTATION
-- SIMULATION DATASET
-- 100 simulated railway coal-rake movements + 200 simulated coal trucks
-- Includes source/destination, coordinates, speed, delay, ETA fields,
-- route polylines for the map, replay telemetry, weather features and ML labels.
-- IMPORTANT: these are synthetic/replay records, NOT FOIS/CRIS operational records.
-- Display SIMULATION MODE / HISTORICAL REPLAY in the application.

CREATE DATABASE IF NOT EXISTS coal_visibility;
USE coal_visibility;

SET SESSION cte_max_recursion_depth = 10000;

DROP TABLE IF EXISTS sim_ml_features;
DROP TABLE IF EXISTS sim_weather;
DROP TABLE IF EXISTS sim_truck_telemetry;
DROP TABLE IF EXISTS sim_rail_telemetry;
DROP TABLE IF EXISTS sim_route_points;
DROP TABLE IF EXISTS sim_routes;
DROP TABLE IF EXISTS sim_trucks;
DROP TABLE IF EXISTS sim_rail_movements;

CREATE TABLE sim_routes (
    route_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_code VARCHAR(40) NOT NULL UNIQUE,
    movement_type ENUM('RAIL','ROAD') NOT NULL,
    source_name VARCHAR(150) NOT NULL,
    destination_name VARCHAR(150) NOT NULL,
    source_lat DECIMAL(10,7) NOT NULL,
    source_lon DECIMAL(10,7) NOT NULL,
    destination_lat DECIMAL(10,7) NOT NULL,
    destination_lon DECIMAL(10,7) NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL,
    route_status ENUM('SIMULATED','OSM_REFINED') NOT NULL DEFAULT 'SIMULATED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_route_pair (movement_type, source_name, destination_name)
);

CREATE TABLE sim_route_points (
    route_point_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id BIGINT NOT NULL,
    point_sequence INT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    FOREIGN KEY (route_id) REFERENCES sim_routes(route_id) ON DELETE CASCADE,
    UNIQUE KEY uq_route_point (route_id, point_sequence),
    INDEX idx_route_points (route_id, point_sequence)
);

CREATE TABLE sim_rail_movements (
    rail_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movement_code VARCHAR(30) NOT NULL UNIQUE,
    rake_id VARCHAR(50) NOT NULL UNIQUE,
    route_id BIGINT NOT NULL,
    source_name VARCHAR(150) NOT NULL,
    destination_name VARCHAR(150) NOT NULL,
    coal_grade VARCHAR(30) NOT NULL,
    wagon_count INT NOT NULL,
    payload_per_wagon_t DECIMAL(8,2) NOT NULL,
    tonnage DECIMAL(12,2) NOT NULL,
    scheduled_departure DATETIME NOT NULL,
    scheduled_arrival DATETIME NOT NULL,
    actual_departure DATETIME NOT NULL,
    actual_arrival DATETIME NOT NULL,
    current_lat DECIMAL(10,7) NOT NULL,
    current_lon DECIMAL(10,7) NOT NULL,
    current_speed_kmph DECIMAL(7,2) NOT NULL,
    distance_travelled_km DECIMAL(10,2) NOT NULL,
    distance_remaining_km DECIMAL(10,2) NOT NULL,
    previous_delay_min DECIMAL(8,2) NOT NULL,
    predicted_delay_min DECIMAL(8,2) NULL,
    predicted_eta DATETIME NULL,
    status ENUM('PLANNED','IN_TRANSIT','DELAYED','STOPPED','ARRIVED') NOT NULL,
    simulation_state ENUM('SIMULATED','HISTORICAL_REPLAY') NOT NULL DEFAULT 'SIMULATED',
    FOREIGN KEY (route_id) REFERENCES sim_routes(route_id),
    INDEX idx_rail_status (status),
    INDEX idx_rail_route (route_id)
);

CREATE TABLE sim_trucks (
    truck_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_code VARCHAR(30) NOT NULL UNIQUE,
    shipment_code VARCHAR(50) NOT NULL,
    route_id BIGINT NOT NULL,
    source_name VARCHAR(150) NOT NULL,
    destination_name VARCHAR(150) NOT NULL,
    coal_grade VARCHAR(30) NOT NULL,
    capacity_t DECIMAL(8,2) NOT NULL,
    load_t DECIMAL(8,2) NOT NULL,
    scheduled_departure DATETIME NOT NULL,
    scheduled_arrival DATETIME NOT NULL,
    actual_arrival DATETIME NOT NULL,
    current_lat DECIMAL(10,7) NOT NULL,
    current_lon DECIMAL(10,7) NOT NULL,
    current_speed_kmph DECIMAL(7,2) NOT NULL,
    distance_travelled_km DECIMAL(10,2) NOT NULL,
    distance_remaining_km DECIMAL(10,2) NOT NULL,
    previous_delay_min DECIMAL(8,2) NOT NULL,
    predicted_delay_min DECIMAL(8,2) NULL,
    predicted_eta DATETIME NULL,
    traffic_level ENUM('LOW','MEDIUM','HIGH','SEVERE') NOT NULL,
    status ENUM('PLANNED','LOADED','IN_TRANSIT','DELAYED','STOPPED','DELIVERED') NOT NULL,
    simulation_state ENUM('SIMULATED','HISTORICAL_REPLAY') NOT NULL DEFAULT 'SIMULATED',
    FOREIGN KEY (route_id) REFERENCES sim_routes(route_id),
    INDEX idx_truck_status (status),
    INDEX idx_truck_route (route_id)
);

CREATE TABLE sim_rail_telemetry (
    telemetry_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rail_id BIGINT NOT NULL,
    recorded_at DATETIME NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    speed_kmph DECIMAL(7,2) NOT NULL,
    distance_travelled_km DECIMAL(10,2) NOT NULL,
    distance_remaining_km DECIMAL(10,2) NOT NULL,
    segment_name VARCHAR(80) NOT NULL,
    delay_min DECIMAL(8,2) NOT NULL DEFAULT 0,
    weather_code INT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'REPLAY_SIMULATOR',
    FOREIGN KEY (rail_id) REFERENCES sim_rail_movements(rail_id) ON DELETE CASCADE,
    INDEX idx_rail_time (rail_id, recorded_at)
);

CREATE TABLE sim_truck_telemetry (
    telemetry_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL,
    recorded_at DATETIME NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    speed_kmph DECIMAL(7,2) NOT NULL,
    distance_travelled_km DECIMAL(10,2) NOT NULL,
    distance_remaining_km DECIMAL(10,2) NOT NULL,
    road_segment VARCHAR(80) NOT NULL,
    traffic_level ENUM('LOW','MEDIUM','HIGH','SEVERE') NOT NULL,
    delay_min DECIMAL(8,2) NOT NULL DEFAULT 0,
    weather_code INT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'TRUCK_REPLAY_SIMULATOR',
    FOREIGN KEY (truck_id) REFERENCES sim_trucks(truck_id) ON DELETE CASCADE,
    INDEX idx_truck_time (truck_id, recorded_at)
);

CREATE TABLE sim_weather (
    weather_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recorded_at DATETIME NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    temperature_c DECIMAL(5,2) NOT NULL,
    humidity_pct DECIMAL(5,2) NOT NULL,
    rain_mm DECIMAL(7,2) NOT NULL,
    wind_speed_kmph DECIMAL(7,2) NOT NULL,
    weather_code INT NOT NULL,
    visibility_km DECIMAL(6,2) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'SIMULATION',
    INDEX idx_weather_time (recorded_at)
);

CREATE TABLE sim_ml_features (
    feature_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movement_type ENUM('RAIL','ROAD') NOT NULL,
    movement_code VARCHAR(50) NOT NULL,
    recorded_at DATETIME NOT NULL,
    distance_remaining_km DECIMAL(10,2) NOT NULL,
    current_speed_kmph DECIMAL(7,2) NOT NULL,
    average_speed_kmph DECIMAL(7,2) NOT NULL,
    previous_delay_min DECIMAL(8,2) NOT NULL,
    dwell_time_min DECIMAL(8,2) NOT NULL,
    temperature_c DECIMAL(5,2) NOT NULL,
    humidity_pct DECIMAL(5,2) NOT NULL,
    rain_mm DECIMAL(7,2) NOT NULL,
    wind_speed_kmph DECIMAL(7,2) NOT NULL,
    traffic_level VARCHAR(20) NULL,
    hour_of_day TINYINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    actual_delay_min DECIMAL(8,2) NOT NULL,
    actual_arrival DATETIME NOT NULL,
    INDEX idx_ml_movement (movement_type, movement_code)
);

-- ============================================================
-- DML 1: route seed data
-- These are realistic Indian coal logistics anchors. The actual
-- movement records below remain SIMULATED and do not claim to be
-- historical FOIS/CRIS movements.
-- ============================================================

INSERT INTO sim_routes
(route_code,movement_type,source_name,destination_name,source_lat,source_lon,destination_lat,destination_lon,distance_km)
VALUES
('RAIL-001','RAIL','Talcher MCL','Talcher Kaniha',20.9500000,85.2300000,20.9000000,85.1300000,35.00),
('RAIL-002','RAIL','Talcher MCL','Paradip Port',20.9500000,85.2300000,20.2700000,86.6700000,220.00),
('RAIL-003','RAIL','Talcher MCL','Dhamra Port',20.9500000,85.2300000,20.7900000,86.9500000,233.00),
('RAIL-004','RAIL','Korba Gevra','NTPC Korba',22.3500000,82.6500000,22.3600000,82.7000000,40.00),
('RAIL-005','RAIL','Talaipalli Mine','NTPC Lara',22.1700000,83.5500000,21.8800000,83.3900000,90.00),
('RAIL-006','RAIL','Jayant Mine','NTPC Singrauli',24.2000000,82.7000000,24.1000000,82.6500000,45.00),
('RAIL-007','RAIL','Pakri Barwadih','NTPC Barh',23.7800000,85.3500000,25.4900000,85.7100000,300.00),
('RAIL-008','RAIL','Amelia Mine','NTPC Khurja',24.0500000,81.1200000,28.2500000,77.8500000,780.00),
('RAIL-009','RAIL','Dulanga Mine','NTPC Darlipali',21.3000000,83.9500000,21.3500000,83.9500000,45.00),
('RAIL-010','RAIL','Kerandari Mine','NTPC Tanda',23.9800000,85.6000000,26.5500000,82.6500000,460.00),
('RAIL-011','RAIL','Talcher MCL','NTPC Vindhyachal',20.9500000,85.2300000,24.1000000,82.6800000,900.00),
('RAIL-012','RAIL','Jayant Mine','NTPC Rihand',24.2000000,82.7000000,24.2000000,83.0000000,70.00),
('RAIL-013','RAIL','Talaipalli Mine','NTPC Sipat',22.1700000,83.5500000,22.1500000,82.2000000,170.00),
('RAIL-014','RAIL','Pakri Barwadih','NTPC Kahalgaon',23.7800000,85.3500000,25.3300000,87.2300000,420.00),
('ROAD-001','ROAD','Talcher MCL','Talcher Kaniha',20.9500000,85.2300000,20.9000000,85.1300000,28.00),
('ROAD-002','ROAD','Talcher MCL','Paradip Port',20.9500000,85.2300000,20.2700000,86.6700000,205.00),
('ROAD-003','ROAD','Talcher MCL','Dhamra Port',20.9500000,85.2300000,20.7900000,86.9500000,220.00),
('ROAD-004','ROAD','Bhubaneswari Mine','Talcher Kaniha',20.9800000,85.1700000,20.9000000,85.1300000,32.00),
('ROAD-005','ROAD','Korba Gevra','NTPC Korba',22.3500000,82.6500000,22.3600000,82.7000000,35.00),
('ROAD-006','ROAD','Talaipalli Mine','NTPC Lara',22.1700000,83.5500000,21.8800000,83.3900000,78.00),
('ROAD-007','ROAD','Jayant Mine','NTPC Singrauli',24.2000000,82.7000000,24.1000000,82.6500000,38.00),
('ROAD-008','ROAD','Pakri Barwadih','NTPC Barh',23.7800000,85.3500000,25.4900000,85.7100000,270.00),
('ROAD-009','ROAD','Amelia Mine','NTPC Khurja',24.0500000,81.1200000,28.2500000,77.8500000,740.00),
('ROAD-010','ROAD','Dulanga Mine','NTPC Darlipali',21.3000000,83.9500000,21.3500000,83.9500000,35.00),
('ROAD-011','ROAD','Kerandari Mine','NTPC Tanda',23.9800000,85.6000000,26.5500000,82.6500000,430.00),
('ROAD-012','ROAD','Talcher MCL','NTPC Vindhyachal',20.9500000,85.2300000,24.1000000,82.6800000,850.00),
('ROAD-013','ROAD','Jayant Mine','NTPC Rihand',24.2000000,82.7000000,24.2000000,83.0000000,58.00),
('ROAD-014','ROAD','Talaipalli Mine','NTPC Sipat',22.1700000,83.5500000,22.1500000,82.2000000,145.00),
('ROAD-015','ROAD','Pakri Barwadih','NTPC Kahalgaon',23.7800000,85.3500000,25.3300000,87.2300000,385.00);

-- ============================================================
-- DML 2: route points for map tracks/roads
-- The frontend draws these points as Leaflet polylines.
-- They are deliberately simple simulation geometry. Later we can
-- replace them with OSM-derived rail/road geometry.
-- ============================================================

INSERT INTO sim_route_points(route_id,point_sequence,latitude,longitude)
WITH RECURSIVE n AS (
    SELECT 1 AS point_sequence
    UNION ALL SELECT point_sequence + 1 FROM n WHERE point_sequence < 12
)
SELECT
    r.route_id,
    n.point_sequence,
    ROUND(r.source_lat + (r.destination_lat-r.source_lat) * (n.point_sequence-1)/11,7),
    ROUND(r.source_lon + (r.destination_lon-r.source_lon) * (n.point_sequence-1)/11,7)
FROM sim_routes r CROSS JOIN n;

-- ============================================================
-- DML 3: 100 simulated train/rake master records
-- ============================================================

INSERT INTO sim_rail_movements
(movement_code,rake_id,route_id,source_name,destination_name,coal_grade,wagon_count,
 payload_per_wagon_t,tonnage,scheduled_departure,scheduled_arrival,actual_departure,
 actual_arrival,current_lat,current_lon,current_speed_kmph,distance_travelled_km,
 distance_remaining_km,previous_delay_min,predicted_delay_min,predicted_eta,status,simulation_state)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL SELECT n+1 FROM seq WHERE n < 100
), base AS (
    SELECT
        seq.n,
        r.route_id,r.source_name,r.destination_name,r.distance_km,
        r.source_lat,r.source_lon,r.destination_lat,r.destination_lon,
        52 + MOD(seq.n,9) AS wagon_count,
        CASE MOD(seq.n,3) WHEN 0 THEN 55.68 WHEN 1 THEN 60.00 ELSE 63.00 END AS payload,
        TIMESTAMP('2026-09-20 06:00:00') + INTERVAL MOD(seq.n,48) HOUR AS dep,
        MOD(seq.n*17,76) AS delay_min
    FROM seq
    JOIN sim_routes r ON r.route_code=CONCAT('RAIL-',LPAD(MOD(seq.n-1,14)+1,3,'0'))
)
SELECT
    CONCAT('SIM-R-',LPAD(n,3,'0')),
    CONCAT('CR-SIM-',LPAD(n,4,'0')),
    route_id,source_name,destination_name,
    CASE MOD(n,4) WHEN 0 THEN 'GCV-4000' WHEN 1 THEN 'GCV-4200' WHEN 2 THEN 'GCV-4300' ELSE 'GCV-4500' END,
    wagon_count,payload,wagon_count*payload,
    dep,
    dep + INTERVAL CEIL(distance_km/50) HOUR,
    dep,
    dep + INTERVAL CEIL(distance_km/50) HOUR + INTERVAL delay_min MINUTE,
    source_lat + (destination_lat-source_lat)*(0.25 + MOD(n,65)/100),
    source_lon + (destination_lon-source_lon)*(0.25 + MOD(n,65)/100),
    45 + MOD(n*7,34),
    distance_km*(0.25 + MOD(n,65)/100),
    distance_km*(1-(0.25 + MOD(n,65)/100)),
    delay_min,
    GREATEST(0,delay_min + MOD(n,9)-4),
    dep + INTERVAL CEIL(distance_km/50) HOUR + INTERVAL GREATEST(0,delay_min + MOD(n,9)-4) MINUTE,
    CASE WHEN delay_min >= 35 THEN 'DELAYED' ELSE 'IN_TRANSIT' END,
    'SIMULATED'
FROM base;

-- ============================================================
-- DML 4: 200 simulated truck master records
-- ============================================================

INSERT INTO sim_trucks
(truck_code,shipment_code,route_id,source_name,destination_name,coal_grade,capacity_t,load_t,
 scheduled_departure,scheduled_arrival,actual_arrival,current_lat,current_lon,current_speed_kmph,
 distance_travelled_km,distance_remaining_km,previous_delay_min,predicted_delay_min,predicted_eta,
 traffic_level,status,simulation_state)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL SELECT n+1 FROM seq WHERE n < 200
), base AS (
    SELECT
        seq.n,
        r.route_id,r.source_name,r.destination_name,r.distance_km,
        r.source_lat,r.source_lon,r.destination_lat,r.destination_lon,
        CASE MOD(seq.n,4) WHEN 0 THEN 25 WHEN 1 THEN 30 WHEN 2 THEN 35 ELSE 40 END AS capacity,
        MOD(seq.n*13,91) AS delay_min
    FROM seq
    JOIN sim_routes r ON r.route_code=CONCAT('ROAD-',LPAD(MOD(seq.n-1,15)+1,3,'0'))
)
SELECT
    CONCAT('SIM-T-',LPAD(n,3,'0')),
    CONCAT('SIM-SHP-',LPAD(n,4,'0')),
    route_id,source_name,destination_name,
    CASE MOD(n,4) WHEN 0 THEN 'GCV-4000' WHEN 1 THEN 'GCV-4200' WHEN 2 THEN 'GCV-4300' ELSE 'GCV-4500' END,
    capacity,ROUND(capacity*(0.78 + MOD(n,20)/100),2),
    TIMESTAMP('2026-09-20 06:00:00') + INTERVAL MOD(n,72) HOUR,
    TIMESTAMP('2026-09-20 06:00:00') + INTERVAL MOD(n,72) HOUR + INTERVAL CEIL(distance_km/42) HOUR,
    TIMESTAMP('2026-09-20 06:00:00') + INTERVAL MOD(n,72) HOUR + INTERVAL CEIL(distance_km/42) HOUR + INTERVAL delay_min MINUTE,
    source_lat + (destination_lat-source_lat)*(0.20 + MOD(n,70)/100),
    source_lon + (destination_lon-source_lon)*(0.20 + MOD(n,70)/100),
    25 + MOD(n*11,44),
    distance_km*(0.20 + MOD(n,70)/100),
    distance_km*(1-(0.20 + MOD(n,70)/100)),
    delay_min,
    GREATEST(0,delay_min + MOD(n,11)-5),
    TIMESTAMP('2026-09-20 06:00:00') + INTERVAL MOD(n,72) HOUR + INTERVAL CEIL(distance_km/42) HOUR + INTERVAL GREATEST(0,delay_min + MOD(n,11)-5) MINUTE,
    CASE MOD(n,4) WHEN 0 THEN 'LOW' WHEN 1 THEN 'MEDIUM' WHEN 2 THEN 'HIGH' ELSE 'SEVERE' END,
    CASE WHEN delay_min >= 40 THEN 'DELAYED' WHEN MOD(n,9)=0 THEN 'STOPPED' ELSE 'IN_TRANSIT' END,
    'SIMULATED'
FROM base;

-- ============================================================
-- DML 5: replay telemetry for the live map
-- 12 historical positions per train and 12 per truck.
-- The simulator will emit these rows one at a time over WebSocket.
-- ============================================================

INSERT INTO sim_rail_telemetry
(rail_id,recorded_at,latitude,longitude,speed_kmph,distance_travelled_km,distance_remaining_km,segment_name,delay_min,weather_code)
WITH RECURSIVE p AS (
    SELECT 1 AS point_no
    UNION ALL SELECT point_no+1 FROM p WHERE point_no < 12
)
SELECT
    m.rail_id,
    m.scheduled_departure + INTERVAL ((p.point_no-1)*20) MINUTE,
    r.source_lat + (r.destination_lat-r.source_lat)*(p.point_no-1)/11,
    r.source_lon + (r.destination_lon-r.source_lon)*(p.point_no-1)/11,
    GREATEST(25,m.current_speed_kmph - 8 + MOD(m.rail_id+p.point_no,17)),
    r.distance_km*(p.point_no-1)/11,
    r.distance_km*(1-(p.point_no-1)/11),
    CONCAT('RAIL-SEG-',LPAD(p.point_no,2,'0')),
    ROUND(m.previous_delay_min*(p.point_no-1)/11,2),
    CASE MOD(m.rail_id+p.point_no,7) WHEN 0 THEN 63 WHEN 1 THEN 61 WHEN 2 THEN 2 ELSE 0 END
FROM sim_rail_movements m
JOIN sim_routes r ON r.route_id=m.route_id
CROSS JOIN p;

INSERT INTO sim_truck_telemetry
(truck_id,recorded_at,latitude,longitude,speed_kmph,distance_travelled_km,distance_remaining_km,road_segment,traffic_level,delay_min,weather_code)
WITH RECURSIVE p AS (
    SELECT 1 AS point_no
    UNION ALL SELECT point_no+1 FROM p WHERE point_no < 12
)
SELECT
    m.truck_id,
    m.scheduled_departure + INTERVAL ((p.point_no-1)*15) MINUTE,
    r.source_lat + (r.destination_lat-r.source_lat)*(p.point_no-1)/11,
    r.source_lon + (r.destination_lon-r.source_lon)*(p.point_no-1)/11,
    GREATEST(8,m.current_speed_kmph - CASE m.traffic_level WHEN 'SEVERE' THEN 18 WHEN 'HIGH' THEN 12 WHEN 'MEDIUM' THEN 6 ELSE 0 END + MOD(m.truck_id+p.point_no,9)),
    r.distance_km*(p.point_no-1)/11,
    r.distance_km*(1-(p.point_no-1)/11),
    CONCAT('ROAD-SEG-',LPAD(p.point_no,2,'0')),
    m.traffic_level,
    ROUND(m.previous_delay_min*(p.point_no-1)/11,2),
    CASE MOD(m.truck_id+p.point_no,7) WHEN 0 THEN 63 WHEN 1 THEN 61 WHEN 2 THEN 2 ELSE 0 END
FROM sim_trucks m
JOIN sim_routes r ON r.route_id=m.route_id
CROSS JOIN p;

-- ============================================================
-- DML 6: synthetic weather features for the ML pipeline.
-- Replace these with historical Open-Meteo values before claiming
-- real weather-based model performance.
-- ============================================================

INSERT INTO sim_weather
(recorded_at,latitude,longitude,temperature_c,humidity_pct,rain_mm,wind_speed_kmph,weather_code,visibility_km)
SELECT
    recorded_at,latitude,longitude,
    ROUND(22 + MOD(telemetry_id*7,130)/10,2),
    ROUND(48 + MOD(telemetry_id*11,450)/10,2),
    CASE MOD(telemetry_id,8) WHEN 0 THEN 8.5 WHEN 1 THEN 3.2 WHEN 2 THEN 1.1 ELSE 0 END,
    ROUND(6 + MOD(telemetry_id*5,240)/10,2),
    CASE MOD(telemetry_id,8) WHEN 0 THEN 63 WHEN 1 THEN 61 WHEN 2 THEN 2 ELSE 0 END,
    CASE MOD(telemetry_id,8) WHEN 0 THEN 4.5 WHEN 1 THEN 7.0 ELSE 12.0 END
FROM sim_rail_telemetry;

INSERT INTO sim_weather
(recorded_at,latitude,longitude,temperature_c,humidity_pct,rain_mm,wind_speed_kmph,weather_code,visibility_km)
SELECT
    recorded_at,latitude,longitude,
    ROUND(22 + MOD(telemetry_id*9,130)/10,2),
    ROUND(48 + MOD(telemetry_id*13,450)/10,2),
    CASE MOD(telemetry_id,8) WHEN 0 THEN 8.5 WHEN 1 THEN 3.2 WHEN 2 THEN 1.1 ELSE 0 END,
    ROUND(6 + MOD(telemetry_id*7,240)/10,2),
    CASE MOD(telemetry_id,8) WHEN 0 THEN 63 WHEN 1 THEN 61 WHEN 2 THEN 2 ELSE 0 END,
    CASE MOD(telemetry_id,8) WHEN 0 THEN 4.5 WHEN 1 THEN 7.0 ELSE 12.0 END
FROM sim_truck_telemetry;

-- ============================================================
-- DML 7: ML-ready training rows.
-- These labels are synthetic so the pipeline can be developed.
-- Do NOT report model accuracy from these rows as real-world accuracy.
-- ============================================================

INSERT INTO sim_ml_features
(movement_type,movement_code,recorded_at,distance_remaining_km,current_speed_kmph,average_speed_kmph,
 previous_delay_min,dwell_time_min,temperature_c,humidity_pct,rain_mm,wind_speed_kmph,traffic_level,
 hour_of_day,day_of_week,actual_delay_min,actual_arrival)
SELECT
    'RAIL',m.movement_code,t.recorded_at,t.distance_remaining_km,t.speed_kmph,t.speed_kmph,
    t.delay_min,CASE WHEN MOD(t.telemetry_id,7)=0 THEN 20 ELSE 0 END,
    w.temperature_c,w.humidity_pct,w.rain_mm,w.wind_speed_kmph,NULL,
    HOUR(t.recorded_at),DAYOFWEEK(t.recorded_at),m.previous_delay_min,m.actual_arrival
FROM sim_rail_telemetry t
JOIN sim_rail_movements m ON m.rail_id=t.rail_id
JOIN sim_weather w ON w.recorded_at=t.recorded_at AND ABS(w.latitude-t.latitude)<0.00001 AND ABS(w.longitude-t.longitude)<0.00001;

INSERT INTO sim_ml_features
(movement_type,movement_code,recorded_at,distance_remaining_km,current_speed_kmph,average_speed_kmph,
 previous_delay_min,dwell_time_min,temperature_c,humidity_pct,rain_mm,wind_speed_kmph,traffic_level,
 hour_of_day,day_of_week,actual_delay_min,actual_arrival)
SELECT
    'ROAD',m.truck_code,t.recorded_at,t.distance_remaining_km,t.speed_kmph,t.speed_kmph,
    t.delay_min,CASE WHEN MOD(t.telemetry_id,7)=0 THEN 15 ELSE 0 END,
    w.temperature_c,w.humidity_pct,w.rain_mm,w.wind_speed_kmph,t.traffic_level,
    HOUR(t.recorded_at),DAYOFWEEK(t.recorded_at),m.previous_delay_min,m.actual_arrival
FROM sim_truck_telemetry t
JOIN sim_trucks m ON m.truck_id=t.truck_id
JOIN sim_weather w ON w.recorded_at=t.recorded_at AND ABS(w.latitude-t.latitude)<0.00001 AND ABS(w.longitude-t.longitude)<0.00001;

-- ============================================================
-- VALIDATION
-- ============================================================
SELECT COUNT(*) AS rail_count FROM sim_rail_movements;
SELECT COUNT(*) AS truck_count FROM sim_trucks;
SELECT COUNT(*) AS rail_telemetry_count FROM sim_rail_telemetry;
SELECT COUNT(*) AS truck_telemetry_count FROM sim_truck_telemetry;
SELECT COUNT(*) AS route_count FROM sim_routes;
SELECT COUNT(*) AS route_point_count FROM sim_route_points;
SELECT COUNT(*) AS ml_feature_count FROM sim_ml_features;

-- Current map data for the frontend
SELECT movement_code,rake_id,source_name,destination_name,current_lat,current_lon,current_speed_kmph,
       distance_remaining_km,previous_delay_min,predicted_delay_min,predicted_eta,status
FROM sim_rail_movements;

SELECT truck_code,shipment_code,source_name,destination_name,current_lat,current_lon,current_speed_kmph,
       distance_remaining_km,previous_delay_min,predicted_delay_min,predicted_eta,traffic_level,status
FROM sim_trucks;

