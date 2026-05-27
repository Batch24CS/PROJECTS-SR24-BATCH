import React from "react";

function Market() {

  const prices = [

    {
      crop: "Rice",
      price: "₹2200/quintal"
    },

    {
      crop: "Cotton",
      price: "₹7200/quintal"
    },

    {
      crop: "Tomato",
      price: "₹35/kg"
    }
  ];

  return (

    <div className="dashboard">

      <h1>📈 Market Prices</h1>

      {
        prices.map((item, index) => (

          <div
            className="market-item"
            key={index}
          >

            <h3>{item.crop}</h3>

            <p>{item.price}</p>

          </div>

        ))
      }

    </div>
  );
}

export default Market;