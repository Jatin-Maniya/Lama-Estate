export const formatINR = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "-"

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value))
}
