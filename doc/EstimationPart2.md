# Project Estimation part 2



Goal of this document is to compare actual effort and size of the project, vs the estimates made in task1.

## Computation of size

To compute the lines of code use cloc    
To install cloc:  
           `npm install -g cloc`   
On Windows, also a perl interpreter needs to be installed. You find it here https://strawberryperl.com/  
To run cloc  
           `cloc <directory containing ts files> --include-lang=TypeScript`  
As a result of cloc collect the *code* value (rightmost column of the result table)  
        

Compute two separate values of size  
-LOC of production code     `cloc <Geocontrol\src> --include-lang=TypeScript`  
-LOC of test code      `cloc <GeoControl\test> --include-lang=TypeScript`  


## Computation of effort 
From timesheet.md sum all effort spent, in **ALL** activities (task1, task2, task3) at the end of the project on June 7. Exclude task4


| Activity              | Effort (person-hours) |
|-----------------------|:---------------------:|
| Requirement Engineering |        44           |
| Design                  |        2.5          |
| Coding                  |        26           |
| Unit Testing            |        17           |
| Integration Testing     |        8            |
| Acceptance Testing      |        14.5         |
| **Total**               |      **112**        |

## Computation of productivity

## Productivity Calculation

```
productivity = (LOC of production code + LOC of test code) / effort
```

## Comparison

| Metric                 | Estimated (end of task 1) | Actual (June 7, end of task 3) |
|------------------------|:------------------------:|:------------------------------:|
| Production code size   |         unknown          | 2210                           |
| Test code size         |         unknown          | 6669                           |
| Total size             | 6000                     | 8879                           |
| Effort                 | 600                      | 112ph                          |
| Productivity           |      10 loc/hour         | 79.4 loc/hour                  |



Report, as estimate of effort, the value obtained via activity decomposition technique.


