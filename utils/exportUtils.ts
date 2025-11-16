
/**
 * Converts an array of objects to a CSV string and triggers a download.
 * Handles nested objects and null values gracefully.
 * @param data The array of objects to convert.
 * @param filename The base filename for the downloaded file (without extension).
 */
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        console.warn("Export failed: No data to export.");
        return;
    }

    // Use the keys from the first object as headers
    const headers = Object.keys(data[0]);
    
    const replacer = (key: any, value: any) => value === null ? '' : value;

    const csvRows = data.map(row =>
        headers.map(fieldName => {
            const value = row[fieldName];
            // Stringify value to handle commas, quotes, etc.
            let stringValue = JSON.stringify(value, replacer);
            // Remove quotes from the start and end of the string if it's a simple string
            if (stringValue && stringValue.startsWith('"') && stringValue.endsWith('"')) {
                stringValue = stringValue.substring(1, stringValue.length - 1);
            }
            return `"${stringValue.replace(/"/g, '""')}"`; // Escape double quotes
        }).join(',')
    );

    // Prepend the header row
    csvRows.unshift(headers.join(','));

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
