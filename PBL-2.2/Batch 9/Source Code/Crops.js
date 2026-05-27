import React from "react";

function Crops() {

  const crops = [

    {
      name: "Rice",
      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
    },

    {
      name: "Tomato",
      image:
        "https://images.unsplash.com/photo-1546094096-0df4bcaaa337"
    },

    {
      name: "Cotton",
      image:
        "https://images.unsplash.com/photo-1598511727991-ed7b407f8ec6"
    }
  ];

  return (

    <div className="dashboard">

      <h1>🌾 Crop Gallery</h1>

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

            </div>

          ))
        }

      </div>

    </div>
  );
}

export default Crops;