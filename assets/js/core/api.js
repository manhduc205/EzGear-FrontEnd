const API_URL = "http://localhost:8080/api"; // chỉnh cho đúng backend EzGear

async function request(endpoint, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_URL + endpoint, { ...options, headers });
  if (!res.ok) throw new Error("API error: " + res.status);
  return res.json();
}
