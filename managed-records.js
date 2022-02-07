// managed-records.js
// controller/services for api requests per the instructions in readme.md

import fetch from "../util/fetch-fill.js";
import URI from "urijs";
import {response} from "express";

// /records endpoint
const path = "http://localhost:3000/records";

// ---------------------------------------------------------------------------------------------------------------
// Description: create query uri string - restricts to 10 items per page
// Parameters: options - param obj (ex: { page: 2, colors: ["red", "brown"] } ); page - overrides page in param obj
// Returns: uri query string
// ---------------------------------------------------------------------------------------------------------------
function composeURI (options, page) {
  const outURI = URI(path)
      .search({
        limit: 10,
        offset: (page - 1) * 10,
        "color[]": options?.colors
      });
  return outURI.toString();
}


// ---------------------------------------------------------------------------------------------------------------
// Description: fetch a page of data
// Parameters: options - param obj (ex: { page: 2, colors: ["red", "brown"] } ); page - overrides page in param obj
// Returns: promise which resolves when page data returned
// ---------------------------------------------------------------------------------------------------------------
async function fetchPage(options, page) {
  return new Promise((resolve) => {
    fetch(composeURI(options, page))
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(() => {
          console.log("Request unsuccessful. Please check input parameters and try again.");
        });
  });
}


// ---------------------------------------------------------------------------------------------------------------
// Description: abstracted object definition because it looked ugly in the function
// Parameters: prev - the previous page number; next - the next page number
// Returns: object used to build response in retrieve()
// ---------------------------------------------------------------------------------------------------------------
function Response(prev, next) {
  this.ids = [];
  this.open = [];
  this.closedPrimaryCount = 0;
  this.previousPage = prev;
  this.nextPage = next;
}


// ---------------------------------------------------------------------------------------------------------------
// Description: gets requested data
// Parameters: options - param obj (ex: { page: 2, colors: ["red", "brown"] } )
// Returns: object composed according to readme instructions
// ---------------------------------------------------------------------------------------------------------------
async function retrieve(options) {
  const primaryArray = ["red", "blue", "yellow"];
  const page = options?.page && options.page > 0 ? options.page : 1;
  const prevPage = page > 1 ? page - 1 : null;
  let nextPage = page + 1;

  // get page and nextpage data from api
  const currentPageData = await fetchPage(options, page);
  // if currentPageData contains fewer than 10 records, we've reached the end, so don't make the extra api call
  const nextPageData = currentPageData.length === 10 ? await fetchPage(options, nextPage) : [];
  nextPage = nextPageData.length ? nextPage : null;

  const responseObject = new Response(prevPage, nextPage);

  // step through the page data we've received and update the response object
  currentPageData.forEach((item) => {
    responseObject.ids.push(item.id);
    if (item.disposition === "open") {
      item.isPrimary = primaryArray.includes(item.color);
      responseObject.open.push(item);
    } else if (primaryArray.includes(item.color)) {
      responseObject.closedPrimaryCount++;
    }
  });

  return responseObject;
}



export default retrieve;
