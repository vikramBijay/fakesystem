// test-amazon.js — backend/ folder mein banao
require("dotenv").config();

(async () => {
  const asin = "B0GS5SM6JR";
  const apiUrl = `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&page=1&country=IN&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
    },
  });

  const json = await response.json();
  const reviews = json?.data?.reviews || [];
  
  reviews.slice(0, 5).forEach((r, i) => {
    console.log(`\n--- Review ${i+1} ---`);
    console.log("title:", r.review_title);
    console.log("comment:", r.review_comment);
    console.log("rating:", r.review_star_rating);
  });
})();