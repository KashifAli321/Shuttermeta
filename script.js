let isKeyVerified = false;
let backendUrl = "https://your-render-backend.onrender.com/gemini"; // Update after backend ready

document.getElementById('verifyKeyButton').onclick = async function() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const statusDiv = document.getElementById('verificationStatus');

  if (!apiKey) {
    statusDiv.innerHTML = "Please enter your Gemini API key.";
    statusDiv.style.color = "red";
    return;
  }

  statusDiv.innerHTML = "Verifying...";
  statusDiv.style.color = "blue";

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, prompt: "Reply OK if the API key is valid." })
    });

    const data = await response.json();
    if (data.content.includes("OK")) {
      isKeyVerified = true;
      statusDiv.innerHTML = "API Key Verified!";
      statusDiv.style.color = "green";
    } else {
      throw new Error();
    }
  } catch (e) {
    statusDiv.innerHTML = "Invalid API Key!";
    statusDiv.style.color = "red";
  }
};

document.getElementById('generateButton').onclick = async function() {
  if (!isKeyVerified) {
    alert("Please verify your Gemini API key first.");
    return;
  }

  const files = document.getElementById('fileInput').files;
  const fileListDiv = document.getElementById('fileList');
  const apiKey = document.getElementById('apiKeyInput').value.trim();

  fileListDiv.innerHTML = "";

  for (let file of files) {
    const block = document.createElement('div');
    block.className = "file-block";
    block.innerHTML = `<strong>${file.name}</strong><br>Generating metadata...`;
    fileListDiv.appendChild(block);

    const prompt = `Generate Shutterstock metadata for file named: "${file.name}". Include a short description and 5-10 keywords.`;

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt })
      });

      const data = await response.json();
      const text = data.content || "Error getting content";

      const [description, keywordsRaw] = text.split(/keywords?:/i);
      const keywords = (keywordsRaw || "").replace(/\n/g, "").trim();

      block.innerHTML = `
        <strong>${file.name}</strong><br>
        <b>Description:</b> ${description.trim()}<br>
        <b>Keywords:</b> ${keywords}
      `;
      block.setAttribute('data-filename', file.name);
      block.setAttribute('data-description', description.trim());
      block.setAttribute('data-keywords', keywords);

    } catch (e) {
      block.innerHTML = `<strong>${file.name}</strong><br><span style="color:red;">Error generating metadata</span>`;
    }
  }
};

document.getElementById('downloadCsvButton').onclick = function() {
  const blocks = document.querySelectorAll('.file-block');
  if (blocks.length === 0) {
    alert("No metadata to download.");
    return;
  }

  let csvContent = "Filename,Description,Keywords,Categories,Editorial,Mature content,Illustration\n";

  blocks.forEach(block => {
    const filename = block.getAttribute('data-filename') || '';
    const description = (block.getAttribute('data-description') || '').replace(/"/g, '""');
    const keywords = (block.getAttribute('data-keywords') || '').replace(/"/g, '""');
    csvContent += `"${filename}","${description}","${keywords}",,no,no,no\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "metadata.csv";
  a.click();
};
