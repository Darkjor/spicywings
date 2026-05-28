// Data for the 3 branches
export const branches = {
    centro: {
        name: "Sucursal Centro",
        phone: "523317037056", // Format: countrycode + number (MX: 52)
        address: "Av. Juárez #105, Col. Centro"
    },
    norte: {
        name: "Sucursal Norte",
        phone: "523317037056",
        address: "Blvd. Bernardo Quintana #450"
    },
    sur: {
        name: "Sucursal Sur",
        phone: "523317037056",
        address: "Av. Constituyentes #209"
    }
};

const BRANCH_KEY = "spicywings_active_branch";

// Get active branch key from localStorage or return null
export function getActiveBranchKey() {
    return localStorage.getItem(BRANCH_KEY);
}

// Get full active branch object
export function getActiveBranch() {
    const key = getActiveBranchKey();
    return key ? branches[key] : null;
}

// Set active branch and persist to localStorage
export function setActiveBranch(branchKey) {
    if (branches[branchKey]) {
        localStorage.setItem(BRANCH_KEY, branchKey);
        updateBranchIndicatorUI(branchKey);
        return true;
    }
    return false;
}

// Update navbar/headers and modal descriptions
export function updateBranchIndicatorUI(branchKey) {
    const indicator = document.getElementById("active-branch-indicator");
    const modalBranchName = document.getElementById("modal-active-branch-name");
    const branch = branches[branchKey];
    
    if (branch) {
        if (indicator) {
            indicator.textContent = `📍 ${branch.name}`;
        }
        if (modalBranchName) {
            modalBranchName.textContent = `${branch.name} (${branch.address})`;
        }
    }
}
