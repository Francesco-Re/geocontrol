# Project Estimation

Date: 19/04/2025

Version: 1.0

# Estimation approach

Consider the GeoControl project as described in the swagger, assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch.

# Estimate by size

### 

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 30       |
| A = Estimated average size per class, in LOC                                                            | 200      |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 6,000    |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 600      |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 18,000   |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 3.75     |

# Estimate by product decomposition

### 

| Component Name       | Estimated Effort (Person Hours) |
| -------------------- | ------------------------------- |
| Requirement Document | 40                              |
| Design Document      | 60                              |
| Code                 | 400                             |
| Unit Tests           | 60                              |
| API Tests            | 40                              |
| Management Documents | 40                              |

### 

| Activity Name               | Estimated Effort (Person Hours) |
| --------------------------- | ------------------------------- |
| Requirements Analysis       | 40                              |
| System Architecture & API Design | 60                              |
| UI/UX Design                | 60                              |
| Database Design             | 60                              |
| Front-End Development       | 200                             |
| Back-End Development        | 400                             |
| Unit Testing                | 60                              |
| API/Integration Testing     | 40                              |
| Deployment Setup            | 40                              |
| Documentation               | 20                              |

### 

```markdown
Week 1–2: Requirements Analysis  
Week 2–4: System Architecture & API Design  
Week 4–6: UI/UX Design + Database Design  
Week 5–15: Development (Front-End + Back-End)  
Week 10–16: Testing  
Week 15–17: Deployment + Final Documentation  
```


# Summary

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 600 hours        | 3.75 weeks         |
| estimate by product decomposition  | 640 hours        | 4 weeks            |
| estimate by activity decomposition | 680 hours        | 4.25 weeks         |

The differences in estimates arise due to the granularity of the breakdown. The size-based estimate assumes uniform productivity, while the product and activity decomposition approaches account for additional tasks like documentation, testing, and deployment, which may not directly correlate with LOC.
