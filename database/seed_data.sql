USE civicconnect;

-- Insert additional citizen test accounts if they don't exist
INSERT IGNORE INTO users (name, email, password, role, active) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', '$2a$10$B75zd/7vwQf/oMnQC9q4gezwPVE2mzTosMoKCH4xRTP./RCsuz.mq', 'CITIZEN', TRUE),
('Jane Doe', 'jane.doe@example.com', '$2a$10$B75zd/7vwQf/oMnQC9q4gezwPVE2mzTosMoKCH4xRTP./RCsuz.mq', 'CITIZEN', TRUE),
('Alex Miller', 'alex.miller@example.com', '$2a$10$B75zd/7vwQf/oMnQC9q4gezwPVE2mzTosMoKCH4xRTP./RCsuz.mq', 'CITIZEN', TRUE),
('Sarah Connor', 'sarah.connor@example.com', '$2a$10$B75zd/7vwQf/oMnQC9q4gezwPVE2mzTosMoKCH4xRTP./RCsuz.mq', 'CITIZEN', TRUE),
('David Beck', 'david.beck@example.com', '$2a$10$B75zd/7vwQf/oMnQC9q4gezwPVE2mzTosMoKCH4xRTP./RCsuz.mq', 'CITIZEN', TRUE);

-- Clean up older complaints if desired, or keep and add seed complaints
-- Let's delete existing test complaints to ensure clean predictable analytics
DELETE FROM audit_logs WHERE action IN ('SEED_INJECT', 'ASSIGN_COMPLAINT', 'STATUS_UPDATE');
DELETE FROM complaints WHERE id > 1;

-- Seed rich, diverse grievances over the last 14 days
INSERT INTO complaints (title, description, category, priority, status, citizen_email, assigned_officer_id, resolution_notes, created_at) VALUES
('Deep crater pothole on Main Boulevard', 'A 2-foot deep pothole has opened up near the junction of Main Blvd and 4th Cross, causing vehicle rim damage and extreme accident risk.', 'ROADS', 'HIGH', 'RESOLVED', 'citizen@civicconnect.gov', 2, 'Road repair team dispatched with cold asphalt mix. Pothole leveled and steamrolled.', NOW() - INTERVAL 13 DAY),

('Contaminated brown tap water in Sector 4', 'Tap water running with dark brown muddy sediment and strong sulfur smell for the past 48 hours.', 'WATER_SUPPLY', 'CRITICAL', 'RESOLVED', 'rahul.sharma@example.com', 2, 'Main distributor line flushed and damaged backflow valve replaced at Sector 4 pumping substation.', NOW() - INTERVAL 12 DAY),

('Streetlights blacked out across Oakwood Lane', 'Entire stretch of 8 streetlights dead from pole #14 to #22. Street pitch dark at night.', 'ELECTRICITY', 'MEDIUM', 'RESOLVED', 'jane.doe@example.com', 2, 'Blown central transformer fuse replaced by night electrical crew.', NOW() - INTERVAL 11 DAY),

('Overflowing municipal garbage dumpster', 'Commercial waste bin overflowing onto pedestrian sidewalk, attracting stray dogs and foul stench.', 'SANITATION', 'HIGH', 'RESOLVED', 'alex.miller@example.com', 2, 'Two hydraulic waste compactors cleared the site. Bin washed with disinfectant and daily clearance scheduled.', NOW() - INTERVAL 10 DAY),

('Broken stormwater drain iron grate', 'Heavy metal drain grating cracked and partially collapsed. Pedestrians could fall into the open drain.', 'DRAINAGE', 'HIGH', 'RESOLVED', 'sarah.connor@example.com', 2, 'New heavy-duty cast iron storm grate installed and welded to frame.', NOW() - INTERVAL 9 DAY),

('Loose high-voltage wire hanging near playground', 'Overhead electrical line sagging dangerously low within arm reach of playground fence.', 'PUBLIC_SAFETY', 'URGENT', 'RESOLVED', 'david.beck@example.com', 2, 'Emergency power shutdown executed. Tension cable re-hung and insulated safely.', NOW() - INTERVAL 8 DAY),

('Heavily rutted road surface after monsoon rains', 'Pavement washed away leaving exposed sharp gravel causing motorbikes to skid.', 'ROADS', 'HIGH', 'IN_PROGRESS', 'citizen@civicconnect.gov', 2, 'Work order #RD-892 issued. Road resurfacing contractor on site with paver.', NOW() - INTERVAL 7 DAY),

('Severe low water pressure in multi-story apartments', 'Water pressure insufficient to reach 2nd floor overhead tanks throughout the colony.', 'WATER_SUPPLY', 'MEDIUM', 'IN_PROGRESS', 'rahul.sharma@example.com', 2, 'Inspecting booster pressure regulator at Colony Reservoir booster #2.', NOW() - INTERVAL 6 DAY),

('Illegal commercial construction debris dumped in green park', 'Truckload of concrete rubble and shattered tiles dumped overnight on walking path.', 'SANITATION', 'MEDIUM', 'IN_PROGRESS', 'alex.miller@example.com', 2, 'Municipal earthmover deployed to clear debris. Notice sent to adjacent builder.', NOW() - INTERVAL 5 DAY),

('Non-functional traffic signal during rush hours', 'Red-yellow-green signal cycle frozen at major junction, causing severe traffic jams.', 'ROADS', 'HIGH', 'IN_PROGRESS', 'sarah.connor@example.com', 2, 'Traffic automation unit technician troubleshooting motherboard timer chip.', NOW() - INTERVAL 4 DAY),

('Sparking transformer pole near residential houses', 'Sparks and popping sounds coming from transformer unit during evening peak load.', 'ELECTRICITY', 'URGENT', 'IN_PROGRESS', 'david.beck@example.com', 2, 'Phase balance check initiated to prevent transformer blowout.', NOW() - INTERVAL 3 DAY),

('Underground sewage manhole overflowing onto street', 'Black foul-smelling sewage bubbling up from manhole cover after rain.', 'DRAINAGE', 'HIGH', 'ASSIGNED', 'citizen@civicconnect.gov', 2, NULL, NOW() - INTERVAL 3 DAY),

('Dead animal carcass on bypass road shoulder', 'Stray cattle carcass on shoulder causing severe hazard and unbearable odor.', 'SANITATION', 'URGENT', 'ASSIGNED', 'jane.doe@example.com', 2, NULL, NOW() - INTERVAL 2 DAY),

('Continuous water pipe leak wasting potable drinking water', 'Pressurized clean water fountain spurting out of sidewalk pavement.', 'WATER_SUPPLY', 'HIGH', 'ASSIGNED', 'rahul.sharma@example.com', 2, NULL, NOW() - INTERVAL 2 DAY),

('Dangerous sinkhole forming around utility chamber', 'Asphalt sinking inward around telecom chamber box on High Street.', 'ROADS', 'HIGH', 'PENDING', 'sarah.connor@example.com', NULL, NULL, NOW() - INTERVAL 1 DAY),

('Garbage collection vehicle skipping Ward 9 for 3 days', 'Door-to-door waste collectors have not arrived since Tuesday in Ward 9 Sector B.', 'SANITATION', 'MEDIUM', 'PENDING', 'citizen@civicconnect.gov', NULL, NULL, NOW() - INTERVAL 1 DAY),

('Street light timer inverted (on during day, off at night)', 'Photocell sensor broken on 12 lights, burning electricity in broad daylight and dark at dusk.', 'ELECTRICITY', 'LOW', 'PENDING', 'david.beck@example.com', NULL, NULL, NOW() - INTERVAL 14 HOUR),

('Contaminated borewell water supply in market area', 'Yellowish brackish water coming from public borewell tap near vegetable market.', 'WATER_SUPPLY', 'HIGH', 'PENDING', 'alex.miller@example.com', NULL, NULL, NOW() - INTERVAL 6 HOUR),

('Missing safety guardrail along canal embankment', 'Metal crash barrier knocked down after vehicle collision, leaving dangerous drop.', 'PUBLIC_SAFETY', 'HIGH', 'PENDING', 'jane.doe@example.com', NULL, NULL, NOW() - INTERVAL 2 HOUR),

('Large pothole cluster developing near bus depot entrance', 'Three interconnected potholes causing city buses to brake abruptly and scrape bottom.', 'ROADS', 'MEDIUM', 'PENDING', 'citizen@civicconnect.gov', NULL, NULL, NOW() - INTERVAL 30 MINUTE);

-- Insert audit logs matching the actions
INSERT INTO audit_logs (action, performed_by, target_id, details, created_at) VALUES
('ASSIGN_COMPLAINT', 'admin@civicconnect.gov', '7', 'Assigned to officer: Field Officer John (officer@civicconnect.gov)', NOW() - INTERVAL 7 DAY),
('STATUS_UPDATE', 'officer@civicconnect.gov', '2', 'Updated status to RESOLVED: Main distributor line flushed and filter replaced', NOW() - INTERVAL 12 DAY),
('STATUS_UPDATE', 'officer@civicconnect.gov', '4', 'Updated status to RESOLVED: Dumpster cleared and disinfected', NOW() - INTERVAL 10 DAY),
('ASSIGN_COMPLAINT', 'admin@civicconnect.gov', '8', 'Assigned to officer: Field Officer John (officer@civicconnect.gov)', NOW() - INTERVAL 6 DAY),
('STATUS_UPDATE', 'officer@civicconnect.gov', '1', 'Updated status to RESOLVED: Pothole leveled with asphalt', NOW() - INTERVAL 13 DAY),
('ASSIGN_COMPLAINT', 'admin@civicconnect.gov', '12', 'Assigned to officer: Field Officer John (officer@civicconnect.gov)', NOW() - INTERVAL 2 DAY);
