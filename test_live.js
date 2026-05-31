const lofiLive = "https://youtube.com/@LofiGirl/live";
const bindaLive = "https://youtube.com/@BINDAxGIRDA/live";

async function test() {
  let res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(lofiLive)}`);
  let data = await res.json();
  console.log("LofiGirl (LIVE):", data.data.title, data.data.url);

  let res2 = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(bindaLive)}`);
  let data2 = await res2.json();
  console.log("Binda (OFFLINE?):", data2.data.title, data2.data.url);
}
test();
