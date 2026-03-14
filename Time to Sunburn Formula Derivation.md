# Time to Sunburn Formula Derivation

## **Introduction**

In this report, we derive the formula for the time until first-degree sunburn while exposed to a given UV index (UVI). This formula will be used for US1.1 of the web application to calculate a time-to-burn using the current UVI, of which will then be relayed to the user.

## **Dose Thresholds**

In the report ‘Relationship between ultraviolet index (UVI) and first-, second- and third-degree sunburn using the Probit methodology’ (Sánchez-Pérez and et. al, 2019), we are provided the beginning dose for a first-degree sunburn for skin types I to IV. 

Note that skin types V and VI are not included in the provided table as they are not sensitive to sun exposure and very rarely experience sunburns.

| Skin Type Classification | Dose (kW/m2)4/3s |
| :---- | :---- |
| I | 84.91.67 |
| II |   1151.80 |
| III |   1434.57 |
| IV |   1954.19 |

To be safe, we will be using the lower bound of the 95% confidence interval for each dose threshold:

| Skin Type Classification | Dose Threshold (95%CI) (kW/m2)4/3s |
| :---- | :---- |
| I |   83.23 |
| II | 113.20 |
| III | 138.43 |
| IV | 190.81 |

For future iterations, the time-to-burn calculations may consider varying skin types input by users as well. However, to avoid scope creep, the current iteration will calculate according to skin type of I, to be on the safe side.

## **Formula Derivation**

Using formulas (4) and (3) from  the same report (Sánchez-Pérez and et. al, 2018):

**Intensity of ultraviolet radiation, IUV, in W/m2:**

| IUV=15.1UVI+35.5      (W/m2)	 | (4) |
| :---- | ----: |

**Dosage of ultraviolet radiation, DUV, in (W/m2)4/3s:**

| DUV=IUV4/3te      ((W/m2)4/3s)	 | (3) |
| :---- | ----: |

We obtain the formula for the amount of time in seconds exposed to UV radiation, until first-degree sunburns occur.

**Exposure time-to-burn (first degree), te, in s:**

| te \= DUVIUV4/3      (s)te= DUV(15.1  UVI \+ 35.5)4/3      (s) | (A) |
| :---- | ----: |

Note that dosage **DUV** is in (W/m2)4/3s, while the dose thresholds are given in (kW/m2)4/3s, so unit conversion is required.

| (kW/m2)4/3s=(1000W/m2)4/3s                          \=10004/3(W/m2)4/3s                           \=10000(W/m2)4/3s  | (B) |
| :---- | ----: |

Thus, we can simply multiply the dosage threshold by 10000 prior to applying it to our formula for te.

## **Using the Formulas**

Given a user with skin type I and a current UVI of 6, we can use formulas (A) and (B) to find the time-to-burn.  Skin type I has a dose threshold of 83.23.

| te= DUV(15.1  UVI \+ 35.5)4/3 \=  10000  83.23(15.1  6 \+ 35.5)4/3 1316      (s) | (C) |
| :---- | ----: |

This means, without ample sun protection, the user will likely start receiving first-degree sunburns when exposed to the sun for more than 1316 seconds, or 21.9 minutes.

**The specific time-to-burn formula for skin type I is as follows:**

| te=  10000  83.23(15.1  UVI \+ 35.5)4/3       (s) | (D) |
| :---- | ----: |

This is the formula we will be using in the backend code for time-to-burn calculations.

## 

## **References**

Sánchez-Pérez, J.F., Vicente-Agullo, D., Barberá, M. *et al.* Relationship between ultraviolet index (UVI) and first-, second- and third-degree sunburn using the Probit methodology. *Sci Rep* **9**, 733 (2019). https://doi.org/10.1038/s41598-018-36850-x