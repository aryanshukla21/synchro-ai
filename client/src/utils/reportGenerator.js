import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCSV = (project, tasks) => {
    // 1. Define CSV Headers
    const headers = ['Task Title', 'Status', 'Priority', 'Assigned To', 'Deadline'];

    // 2. Map Task Data
    const csvRows = tasks.map(task => {
        const title = `"${task.title.replace(/"/g, '""')}"`; // Escape quotes
        const status = task.status || 'To-Do';
        const priority = task.priority || 'Medium';
        const assignedTo = task.assignedTo?.name || 'Unassigned';
        const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline';

        return [title, status, priority, assignedTo, deadline].join(',');
    });

    // 3. Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${project?.name || 'Project'}_Sprint_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generatePDF = (project, tasks, stats) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Dark slate
    doc.text(project.name || 'Project Sprint Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    // --- Stats Summary ---
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Sprint Analytics', 14, 40);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Overall Completion: ${stats.progressPercentage}%`, 14, 48);
    doc.text(`Total Tasks: ${stats.totalTasks}`, 14, 54);
    doc.text(`Completed Tasks: ${stats.completedTasks}`, 14, 60);
    doc.text(`In-Progress: ${stats.tasksByStatus.inprogress} | Pending/To-Do: ${stats.tasksByStatus.todo}`, 14, 66);

    // --- AI Pulse Summary ---
    let finalY = 75;
    if (project.aiSummary) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('AI Pulse Summary', 14, finalY);

        doc.setFontSize(10);
        doc.setTextColor(60);
        const splitSummary = doc.splitTextToSize(project.aiSummary, pageWidth - 28);
        doc.text(splitSummary, 14, finalY + 8);
        finalY = finalY + (splitSummary.length * 5) + 12;
    }

    // --- Task Table ---
    const tableColumn = ["Task", "Status", "Priority", "Assignee", "Deadline"];
    const tableRows = [];

    tasks.forEach(task => {
        const taskData = [
            task.title,
            task.status || 'To-Do',
            task.priority || 'Medium',
            task.assignedTo?.name || 'Unassigned',
            task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'
        ];
        tableRows.push(taskData);
    });

    doc.autoTable({
        startY: finalY,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { top: 10 }
    });

    // --- Trigger Download ---
    doc.save(`${project?.name || 'Project'}_Sprint_Report.pdf`);
};