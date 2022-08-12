## Features

### Built-in GTM events

Full support of the following events is included:

- [Product Impressions](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#product-impressions)
- [Product Clicks](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#product-clicks)
- [Product Detail Impressions](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#details)
- [Add / Remove from Cart](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#cart)
- [Checkout](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#checkout)
- [Purchases](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#purchases)

No support for the following event categories is planned:

- [Refunds](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#refunds)
- [Promotion Impressions](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#promo-impressions)
- [Promotion Clicks](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#promo-clicks)

The support for additional custom events is included:

- User authorization tracking

<table>
  <tr>
   <td>
<strong>User has logged in</strong>
   </td>
   <td>{"event": "userLogin"}
   </td>
  </tr>
  <tr>
   <td><strong>User has registered</strong>
   </td>
   <td>{"event": "userRegister"}
   </td>
  </tr>
</table>

- Search results

<table>
  <tr>
   <td>
<strong>Search was started</strong>
   </td>
   <td>{"event": "siteSearchStarted"}
   </td>
  </tr>
  <tr>
   <td><strong>Search results were returned</strong>
   </td>
   <td>{
<p>
"event": "GAevent",
<p>
"eventCategory": "siteSearch",
<p>
"eventAction": "&lt;Results loaded|No Results Found>",
<p>
"eventLabel": "&lt;SEARCH STRING>",
<p>
"eventNonInteraction": 0,
<p>
}
   </td>
  </tr>
</table>

- Not found pages

<table>
  <tr>
   <td>
<strong>The 404 page was shown</strong>
   </td>
   <td>{
<p>
"event": "notFound"
<p>
"eventCategory": "404 pages"
<p>
"eventAction": "&lt;URL>",
<p>
"eventLabel": "",
<p>
"eventNonInteraction": 1
<p>
}
   </td>
  </tr>
</table>

### Custom dimensions and metrics

Any amount of custom dimensions or custom metrics could be added. Dimensions and metrics will be included in the product-related events payload. More specifically, dimensions are applied to the following events:

- Measuring Product Impressions
- Measuring Product Clicks
- Measuring Views of Product Details
- Measuring Additions or Removals from a Shopping Cart

## Configuration

### Initial configuration

1. In the admin panel navigate to **Stores → Configuration → ScandiPWA → Google Tag Manager → General Configuration**.

2. Enable the module and input your GTM ID. To obtain your GTM ID, visit [https://tagmanager.google.com/](https://tagmanager.google.com/), select your GTM account, then, copy the GTM ID from the top-right corner of the header.

### Managing events

Available DataLayer push events can be enabled under the **Stores → Configuration → ScandiPWA → Google Tag Manager → DataLayer Push Events Configuration**. By default, all events are disabled.

### Managing custom metrics and dimensions

The support for custom dimensions is added. They can be configured from **Stores → Configuration → ScandiPWA → Google Tag Manager → Additional Configuration**. There, you can add any amount of custom dimensions or custom metrics. The value of the dimension/metrics could be an attribute value of the parent or child product or a custom value.

**It is important to name variables properly**. For dimensions, the format is: “dimension&lt;N>” where n is a natural number, for example, “dimension1”. For metrics, the format is “metric&lt;N>” where n is a natural number, for example, “metric3”.

More information on custom metrics and dimensions could be found in the official guide:

- [Passing Product-scoped Custom Dimensions](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#custom-dimensions)
- [Passing Product-scoped Custom Metrics](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce#custom-metrics)

## Debugging

### Checking if GTM is enabled

1. Navigate to the Homepage. Open browser development tools. Switch to the network tab.
2. Filter results by name **gtm.js**
3. If the requests status code is 200, the GTM is working. If not, then make sure that your GTM ID is correct and it has been published at least once with some tags.

### Validating the data layer pushes

1. Use an extension that can show information about data layer pushes, for example, [Adswerve - dataLayer Inspector+](https://chrome.google.com/webstore/detail/adswerve-datalayer-inspec/kmcbdogdandhihllalknlcjfpdjcleom) for Google Chrome.
2. In the case of this extension, information about all pushes can be seen in the browser's console, for example, there should be a **Google dataLayer.push(): event: general**.
3. To see more information, click on the console message to show more information about the selected push.

## Development

### Implementation

Since version **2.0.0** (for ScandiPWA ^5.2.6), the Extension does not utilize Redux anymore. Events can be dispatched from anywhere by calling functions defined in the **src/event** folder. The data for events is collected from the store outside of the components. The data collection logic is located in the **src/data** folder. The plugins that are responsible for event firing are located in the **src/plugin/events** folder. The mapping of events to their implementation folders are located in the **src/util/events**, in comments.
