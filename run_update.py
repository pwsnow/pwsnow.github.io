import re

# Update model.js
with open('js/model.js', 'r') as f:
    model_js = f.read()

model_js = model_js.replace(
    "this.opioidReduction = (params.opioidReduction || 0) / 100; // e.g., 2.8% -> 0.028",
    "this.opioidReduction = (params.opioidReduction || 0) / 100;\n        this.roboticsReduction = (params.roboticsReduction || 0) / 100;\n        this.roboticsCost = params.roboticsCost || 0;"
)

sim_override = """    simulateArm(isVR, specificParams = null) {
        let p = specificParams || this;
        let opReduct = p.opioidReduction !== undefined ? p.opioidReduction : this.opioidReduction;
        let robReduct = p.roboticsReduction !== undefined ? p.roboticsReduction : this.roboticsReduction;
        let vCost = p.vrCost !== undefined ? p.vrCost : this.vrCost;
        let rCost = p.roboticsCost !== undefined ? p.roboticsCost : this.roboticsCost;

        let totalInterventionReduction = 0;
        let totalInterventionCost = 0;

        if (isVR) {
            totalInterventionReduction = opReduct + robReduct;
            totalInterventionCost = vCost + rCost;
        }

        let stateSizes = [0, 0.3, 0.7, 0]; 

        if (totalInterventionReduction > 0) {
            let opioidReductionAbs = stateSizes[2] * totalInterventionReduction;
            stateSizes[2] -= opioidReductionAbs; 
            stateSizes[1] += opioidReductionAbs * 0.8;
            stateSizes[0] += opioidReductionAbs * 0.2;
        }

        let totalCosts = totalInterventionCost;
        let totalQALYs = 0;

        const utilities = this.getUtilities(p);
        const stateCosts = this.getCycleCosts(p);"""

model_js = re.sub(r'simulateArm\(isVR, specificParams = null\) \{.*?(const cohortHistory = \[\];)', 
                  sim_override + "\n        const cohortHistory = [];", model_js, flags=re.DOTALL)

with open('js/model.js', 'w') as f:
    f.write(model_js)
print("Updated model.js")
