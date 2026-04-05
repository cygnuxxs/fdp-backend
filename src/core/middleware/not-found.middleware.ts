import { type Request, type Response } from "express";

export const notFoundQuotes = [
  // The Map & The Explorer
  "Not all those who wander are lost, but this endpoint definitely is.",
  "Even the best maps have blank spaces.",
  "You found a secret path, unfortunately it leads nowhere.",
  "Every wrong turn is data for the next right move.",
  "Great APIs are discovered by curiosity and a few 404s.",
  "The route less traveled was probably never implemented.",
  "This endpoint is off the ledger, but your request is noted.",
  "No match found. Try another path and keep shipping.",
  "You've sailed off the edge of the server.",
  "X marks the spot, but X is strictly undefined.",
  "The compass is spinning. This endpoint does not exist.",
  "We checked the blueprints. This room wasn't built.",
  "You've reached the edge of the known domain.",
  "Your coordinates are pointing straight into the void.",
  "This is uncharted digital territory.",
  "The cartographer fell asleep before drawing this route.",
  "You're exploring a path we haven't paved yet.",
  "A dead end is just a place to turn around.",

  // Sci-Fi & The Cosmos
  "Lost in the vast vacuum of cyberspace.",
  "Houston, we have a 404 problem.",
  "This URL was pulled into a digital black hole.",
  "You've warped to a sector with no data.",
  "A glitch in the matrix? No, just a missing page.",
  "This endpoint exists in a parallel universe, just not this one.",
  "Beam me up, the data is gone.",
  "You've jumped to hyperspace without coordinates.",
  "These aren't the endpoints you're looking for.",
  "Orbiting an empty node.",
  "We pinged the void, and the void did not pong back.",

  // Code & Architecture
  "This page is strictly typed as 'undefined'.",
  "We caught your request, but the resource escaped.",
  "A null pointer in the grand scheme of things.",
  "This endpoint was garbage collected.",
  "Looks like you chased a dangling pointer.",
  "Error 404: Inspiration not found on this route.",
  "The cache is empty, and so is this path.",
  "You successfully routed to nowhere.",
  "Refactoring left this URL behind.",
  "This path was deprecated in the ledger of time.",
  "The circuitry here is shorted out.",
  "Maintenance crew never got to this sector.",
  "A missing cog in the server machine.",
  "Congratulations, you found the API's blind spot.",

  // Zen & Philosophy
  "In the search for meaning, sometimes you find an empty string.",
  "Embrace the void. It’s just a missing resource.",
  "The sound of one hand clapping, or a request with no response.",
  "Nothingness is also a state. State: 404.",
  "You sought data, but found only tranquility.",
  "Look within. The endpoint you seek is not out here.",
  "A blank page is an opportunity to write new code.",
  "To understand the path, you must sometimes lose it.",
  "The journey is the destination, especially when the destination is missing.",
  "Absence of evidence is evidence of a 404.",

  // Detectives & Mysteries
  "The trail goes cold at this exact URL.",
  "We searched the archives. The files are missing.",
  "A mystery wrapped in an enigma, wrapped in a 404.",
  "The investigator found no clues at this endpoint.",
  "This URL is currently in the witness protection program.",
  "We dusted for fingerprints, but the data is gone.",
  "The case of the missing resource remains unsolved.",
  "Redacted by the server.",
  "You followed a phantom link.",
  "The server pleads the fifth on this request.",

  // Nature & The Wilderness
  "A tumbleweed rolls across your screen. Nothing to see here.",
  "This route evaporated like mist in the morning sun.",
  "The data fairies have hidden this page.",
  "You wandered into the digital wilderness.",
  "An illusion! The endpoint never existed.",
  "The magic spell failed. Resource not conjured.",
  "Like a mirage, the data vanishes as you approach.",
  "The wind erased the tracks to this URI.",
  "Buried beneath the sands of deleted code.",
  "A ghost town in the architecture.",

  // Network & Infrastructure
  "The packets were dropped, and so were your hopes.",
  "DNS resolved, but the server declined to elaborate.",
  "A handshake was initiated, but no one was there to shake back.",
  "Your request packet is lonely and unfulfilled.",
  "HTTP 404: The sound of a server sighing.",
  "Routing failed. Please recalculate your life choices.",
  "This socket is unplugged.",
  "The load balancer tipped over trying to find this.",
  "Under construction? No, never constructed.",
  "The gears are turning, but they aren't connected to this URL.",
  "This pipe doesn't lead to the data reservoir.",
  "We ran out of bricks before finishing this path.",
  "The bridge is out ahead.",
  "This conveyor belt brings back nothing.",
  "You've hit the firewall of nothingness.",

  // RPGs & Adventure
  "A dead end in the labyrinth of the web.",
  "You failed the quest for this resource.",
  "The treasure chest is empty.",
  "Turn back! There be dragons (and 404s) here.",
  "You stepped on a trapdoor and fell into the void.",
  "The bridge collapses behind you. Ahead is a 404.",
  "You rolled a natural 1 on your search check.",
  "The dungeon master didn't prepare this room.",
  "Game over. Insert coin to retry URL.",
  "You sequence-broke the application.",

  // Casual & Humorous
  "Peekaboo! The server is hiding.",
  "This is not the page you're looking for.",
  "Oops, you broke the internet. Just kidding, it’s a 404.",
  "We looked everywhere. Under the couch, behind the server racks. Nothing.",
  "Did you type that with your elbows?",
  "The server shrugged.",
  "Well, this is awkward.",
  "Nothing to see here, move along.",
  "Are you lost? Have a cookie instead 🍪",
  "404: Sarcastic remark not found."
] as const;

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * notFoundQuotes.length);
  return notFoundQuotes[randomIndex];
};

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    status: "error",
    code: 404,
    title: "Lost In The API",
    message: `No endpoint found for ${req.method} ${req.originalUrl}`,
    quote: getRandomQuote(),
    suggestions: [
      "Double-check the HTTP method and endpoint path.",
      "Verify route prefixes and version segments.",
      "Use documented endpoints from the API reference.",
    ],
    requested: {
      method: req.method,
      path: req.originalUrl,
    },
    timestamp: new Date().toISOString(),
  });
};
