const baseURL = "https://cors-anywhere.herokuapp.com/ws1.dashlane.com:443";

export const request = async (
  endpoint: string,
  body: any,
  headers: any = false,
  parse: boolean = true
) => {
  const form = new FormData();
  Object.keys(body).map(key => {
    form.append(key, body[key]);
  });
  const response = await fetch(baseURL + endpoint, {
    method: "POST",
    body: form,
    headers: {
      ...(headers !== false && headers),
      "x-requested-with": "MAC"
    }
  });
  return parse ? await response.json() : response.text();
};
