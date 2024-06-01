const http = require("http");
const axios = require("axios");
const { auth } = require("./secrets");

const WINDOW_SIZE = 10;
const SERVER_PORT = 9876;

let numbers = [];

let access_token = null;

const fetchNumbers = async (numberid) => {
  let url = "";
  switch (numberid) {
    case "p":
      url = "http://20.244.56.144/test/primes";
      break;
    case "f":
      url = "http://20.244.56.144/test/fibo";
      break;
    case "e":
      url = "http://20.244.56.144/test/even";
      break;
    case "r":
      url = "http://20.244.56.144/test/rand";
      break;
    default:
      return [];
  }
  try {
    const token = await getAccessToken();
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.numbers;
  } catch (error) {
    console.error("Error fetching numbers:", error.message);
    console.log(error.response.data);
    return [];
  }
};

const checkAccessTokenExpiry = () => {
  if (access_token) return new Date() > new Date(access_token.expires_in);
  return true;
};

const getAccessToken = async () => {
  if (access_token == null || checkAccessTokenExpiry()) {
    try {
      const response = await axios.post(
        "http://20.244.56.144/test/auth",
        JSON.stringify(auth)
      );
      access_token = response.data;
      return response.data.access_token;
    } catch (error) {
      console.log("Error in authorization:", error.message);
      console.log(error.response.data);
      return "";
    }
  } else {
    return access_token.access_token;
  }
};

const calculateAverage = (nums) => {
  const sum = nums.reduce((acc, num) => acc + num, 0);
  return sum / nums.length;
};

const handleRequest = async (req, res) => {
  const { url } = req;
  const url_split = url.split("/");

  const fetchedNumbers = await fetchNumbers(url_split[url_split.length - 1]);

  const uniqueNumbers = [...new Set([...numbers, ...fetchedNumbers])].slice(
    -WINDOW_SIZE
  );

  let avg = null;
  if (uniqueNumbers.length === WINDOW_SIZE) {
    avg = calculateAverage(uniqueNumbers);
  }

  const responseData = {
    windowPrevState: [...numbers],
    windowCurrState: uniqueNumbers,
    numbers: fetchedNumbers,
    avg: avg ? avg.toFixed(2) : null,
  };
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(responseData));

  numbers = uniqueNumbers;
};

const server = http.createServer(handleRequest);

server.listen(SERVER_PORT, () => {
  console.log(`Server running at http://localhost:${SERVER_PORT}/`);
});
