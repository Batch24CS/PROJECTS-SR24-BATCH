import Sidebar from "../components/Sidebar";
import React, { useEffect, useState } from "react";

function Dashboard() {

  const farmerData = JSON.parse(
    localStorage.getItem("farmerData")
  );

  const [weather, setWeather] = useState(null);

  const API_KEY ="de13920f574d420984d3080b1fa6132b&amp";

  useEffect(() => {

    if (!farmerData?.location) return;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${farmerData.location}&units=metric&appid=${API_KEY}`
    )

      .then((res) => res.json())

      .then((data) => {

        console.log(data);

        if (data.main) {

          setWeather({
            temperature: data.main.temp,
            humidity: data.main.humidity,
            condition: data.weather[0].main,
            wind: data.wind.speed
          });

        } else {

          setWeather({
            error: "Weather data not found"
          });
        }

      })

      .catch((error) => {

        console.log(error);

        setWeather({
          error: "Failed to fetch weather"
        });
      });

  }, [farmerData]);

let soil = (farmerData?.soil || "").toLowerCase().trim();

let crops = [];

/* BLACK SOIL */
if (soil.includes("black")) {

  crops = [
    { name: "Cotton", image: "https://images.unsplash.com/photo-1598511727991-ed7b407f8ec6" },
    { name: "Sugarcane", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449" },
    { name: "Wheat", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b" },
    { name: "Sunflower", image: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51" }
  ];
}

/* RED SOIL */
else if (soil.includes("red")) {

  crops = [
    { name: "Tomato", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337" },
    { name: "Groundnut", image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc" },
    { name: "Chili", image: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d" },
    { name: "Onion", image: "https://images.unsplash.com/photo-1508747703725-719777637510" }
  ];
}

/* WET / ALLUVIAL SOIL */
else if (soil.includes("wet") || soil.includes("alluvial")) {

  crops = [
    { name: "Rice", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef" },
    { name: "Jute", image: "https://images.unsplash.com/photo-1600857544200-b2f666a4a6f5" },
    { name: "Sugarcane", image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449" }
  ];
}

/* DEFAULT */
else {

  crops = [
    { name: "Rice", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef" }
  ];
}

let marketPrices = [];

/* BLACK SOIL */

if (
  farmerData?.soil?.toLowerCase().includes("black")
) {

  crops = [

    {
      name: "Cotton",

      image:
        "https://images.unsplash.com/photo-1598511727991-ed7b407f8ec6"
    },

    {
      name: "Sugarcane",

      image:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449"
    },

    {
      name: "Wheat",

      image:
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b"
    },

    {
      name: "Sunflower",

      image:
        "https://images.unsplash.com/photo-1470509037663-253afd7f0f51"
    }
  ];

  marketPrices = [

    {
      crop: "Cotton",
      price: "₹7200/quintal",
      profit: "₹80,000/year"
    },

    {
      crop: "Sugarcane",
      price: "₹3400/quintal"
    },

    {
      crop: "Wheat",
      price: "₹2600/quintal"
    },

    {
      crop: "Sunflower",
      price: "₹5800/quintal"
    }
  ];
}

/* RED SOIL */

else if (
  farmerData?.soil?.toLowerCase().includes("red")
) {

  crops = [

    {
      name: "Tomato",

      image:
        "https://images.unsplash.com/photo-1546094096-0df4bcaaa337"
    },

    {
      name: "Groundnut",

      image:
        "https://images.unsplash.com/photo-1502741338009-cac2772e18bc"
    },

    {
      name: "Chili",

      image:
        "https://images.unsplash.com/photo-1588252303782-cb80119abd6d"
    },

    {
      name: "Onion",

      image:
        "https://images.unsplash.com/photo-1508747703725-719777637510"
    }
  ];

  marketPrices = [

    {
      crop: "Tomato",
      price: "₹35/kg"
    },

    {
      crop: "Groundnut",
      price: "₹6200/quintal"
    },

    {
      crop: "Chili",
      price: "₹9000/quintal"
    },

    {
      crop: "Onion",
      price: "₹25/kg"
    }
  ];
}

/* WET SOIL */

else if (
  farmerData?.soil?.toLowerCase().includes("wet")
) {

  crops = [

    {
      name: "Rice",

      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
    },

    {
      name: "Lotus",

      image:
        "https://images.unsplash.com/photo-1490750967868-88aa4486c946"
    },

    {
      name: "Sugarcane",

      image:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449"
    }
  ];

  marketPrices = [

    {
      crop: "Rice",
      price: "₹2200/quintal"
    },

    {
      crop: "Lotus",
      price: "₹50/stem"
    },

    {
      crop: "Sugarcane",
      price: "₹3400/quintal"
    }
  ];
}

/* DEFAULT */

else {

  crops = [

    {
      name: "Rice",

      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
    },

    {
      name: "Maize",

      image:
        "https://images.unsplash.com/photo-1551754655-cd27e38d2076"
    },

    {
      name: "Potato",

      image:
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655"
    }
  ];

  marketPrices = [

    {
      crop: "Rice",
      price: "₹2200/quintal"
    },

    {
      crop: "Maize",
      price: "₹1800/quintal"
    },

    {
      crop: "Potato",
      price: "₹20/kg"
    }
  ];
}

  return (

          <div className="dashboard-layout">

           <Sidebar />

            <div className="dashboard">

      <h1>
        Welcome {farmerData?.username}
      </h1>

      <div className="dashboard-cards">

        {/* WEATHER */}

        <div className="dash-card">

          <h2>🌦 Weather</h2>

          {
            weather ? (

              weather.error ? (

                <p>{weather.error}</p>

              ) : (

                <div>

                  <p>
                    Temperature:
                    {" "}
                    {weather.temperature}°C
                  </p>

                  <p>
                    Humidity:
                    {" "}
                    {weather.humidity}%
                  </p>

                  <p>
                    Condition:
                    {" "}
                    {weather.condition}
                  </p>

                  <p>
                    Wind Speed:
                    {" "}
                    {weather.wind} km/h
                  </p>

                </div>

              )

            ) : (

              <p>Loading weather...</p>

            )
          }

        </div>

        {/* MARKET */}

        <div className="dash-card">

  <h2>📈 Market Prices</h2>

  {
    marketPrices.map((item, index) => (

      <p key={index}>

        <div className="market-item">

  <p>

    <strong>{item.crop}</strong>

  </p>

  <p>{item.price}</p>

  <p>{item.profit}</p>

</div>

      </p>

    ))
  }

</div>

        {/* LOCATION */}

        <div className="dash-card">

          <h2>🌍 Location</h2>

          <p>{farmerData?.location}</p>

          <p>Soil: {farmerData?.soil}</p>

          <p>Land: {farmerData?.land} acres</p>

        </div>

      </div>

      <h2 className="crop-title">

        Recommended Crops

      </h2>

      <div className="crop-grid">

        {
          crops.map((crop, index) => (

            <div
              className="crop-card"
              key={index}
            >

              <img
                src={crop.image}
                alt={crop.name}
              />
              <h3>{crop.name}</h3>

<p className="crop-info">

  Suitable for {farmerData?.soil} soil

</p>

<p className="crop-info">

  High yield crop

</p>
              

            </div>

          ))
        }

      </div>

        </div>

  </div>

  );
}

export default Dashboard;