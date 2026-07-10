function calculateExpiryDate(purchaseDate, warrantyDuration) {
    const expiryDate = new Date(purchaseDate);

    expiryDate.setMonth(
        expiryDate.getMonth() + warrantyDuration
    );

    return expiryDate;
}