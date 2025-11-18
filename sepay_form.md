Title: Create payment form | SePay

URL Source: https://developer.sepay.vn/en/cong-thanh-toan/API/don-hang/form-thanh-toan

Markdown Content:
What is an order ?

*   In the SePay payment gateway, an **order** is a package of information that describes a payment request, including key attributes such as amount, transaction description, invoice number, customer, and callback URLs for system processing.

*   The API for initializing a payment form uses this information package to create a one-time transaction. You simply need to build a valid HTML form and submit it to the `checkout/init` endpoint to redirect the customer to the payment page.

### Order Creation Flow

1.   **Customer chooses to pay**: The user clicks the pay button on your website
2.   **Website builds an HTML form**: Your server prepares an HTML form with required parameters
3.   **Collect order details**: Fetch data from your database or session
4.   **Prepare form data**: Arrange parameters in the correct format
5.   **Generate signature**: Create an HMAC-SHA256 signature
6.   **Add signature to form**: Include the signature as a hidden field
7.   **Submit form**: POST the form to the `checkout/init` endpoint
8.   **Verify signature**: SePay validates the signature
9.   **Redirect**: If valid, the customer is redirected to SePay’s payment page
10.   **Payment**: The customer completes payment on SePay
11.   **Callback**: SePay calls your callback URLs with the result

* * *

### Endpoint

POST

`https://pay-sandbox.sepay.vn/v1/checkout/init`

Note

This endpoint is for **submitting an HTML form**, not a JSON API call.

You need to create an HTML form with method `POST` and submit it to this endpoint.

* * *

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `merchant` | string | Required | Your merchant ID (e.g., MERCHANT_123) |
| `currency` | string | Required | Currency code (VND only) |
| `order_amount` | string | Required | Order amount (in the smallest unit) |
| `operation` | string | Required | Transaction type (PURCHASE or VERIFY) |
| `order_description` | string | Required | Order description |
| `order_invoice_number` | string | Required | Invoice number (required for PURCHASE, e.g., INV_20231201_001) |
| `payment_method` | string | Not required | Payment method (CARD, BANK_TRANSFER, NAPAS_BANK_TRANSFER) |
| `customer_id` | string | Not required | Customer ID |
| `success_url` | string | Not required | Redirect URL on success (e.g., https://yoursite.com/success) |
| `error_url` | string | Not required | Redirect URL on error (e.g., https://yoursite.com/error) |
| `cancel_url` | string | Not required | Redirect URL on cancel (e.g., https://yoursite.com/cancel) |

Note

The parameters `success_url`, `error_url`, and `cancel_url`**only work when your application is running on a publicly accessible domain or IP address**.

If you are developing locally on **localhost**, consider using tools that expose your local environment to the internet, such as **ngrok**, **localtunnel**, or similar services.

* * *

### Basic Create-Order Example

*   **Build an HTML form**

HTML Form

```
<form method="POST" action="https://pay-sandbox.sepay.vn/v1/checkout/init">
    <input type="hidden" name="merchant" value="MERCHANT_123">
    <input type="hidden" name="currency" value="VND">
    <input type="hidden" name="order_amount" value="100000">
    <input type="hidden" name="operation" value="PURCHASE">
    <input type="hidden" name="order_description" value="Pay order #12345">
    <input type="hidden" name="order_invoice_number" value="INV_20231201_001">
    <input type="hidden" name="customer_id" value="CUST_001">
    <input type="hidden" name="success_url" value="https://yoursite.com/payment/success">
    <input type="hidden" name="error_url" value="https://yoursite.com/payment/error">
    <input type="hidden" name="cancel_url" value="https://yoursite.com/payment/cancel">
    <input type="hidden" name="signature" value="a1b2c3d4e5f6...">
</form>
```

*   **Response:**

After submitting the form, the system redirects the user to SePay’s payment page:

[https://pgapi-sandbox.sepay.vn?merchant=MERCHANT_123&currency=VND&order_amount=100000&operation=PURCHASE&order_description=Pay%20order%20%2312345&order_invoice_number=INV_20231201_001&customer_id=CUST_001&success_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Fsuccess&error_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Ferror&cancel_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Fcancel&signature=a1b2c3d4e5f6...](https://pgapi-sandbox.sepay.vn/?merchant=MERCHANT_123&currency=VND&order_amount=100000&operation=PURCHASE&order_description=Pay%20order%20%2312345&order_invoice_number=INV_20231201_001&customer_id=CUST_001&success_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Fsuccess&error_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Ferror&cancel_url=https%3A%2F%2Fyoursite.com%2Fpayment%2Fcancel&signature=a1b2c3d4e5f6...)

Note

The payment page shows available payment methods based on your merchant configuration.

* * *

### Signature Verification

*   **The signature is generated from form parameters using the following rules:**

1.   **Filter fields to sign**: Only sign these fields: `merchant, operation, payment_method, order_amount, currency, order_invoice_number, order_description, customer_id, success_url, error_url, cancel_url`
2.   **Build the signing string**: `field1=value1,field2=value2,field3=value3...`
3.   **Encode**: `base64_encode(hash_hmac('sha256', $signedString, $secretKey, true))`

*   **Example: generate signature**

PHP signing function

```
public function signFields(array $fields, string $secretKey): string {
    $signed = [];
    $signedFields = array_values(array_filter(array_keys($fields), fn ($field) => in_array($field, [
        'merchant','operation','payment_method','order_amount','currency',
        'order_invoice_number','order_description','customer_id',
      'success_url','error_url','cancel_url'
    ])));

    foreach ($signedFields as $field) {
        if (! isset($fields[$field])) continue;
        $signed[] = $field . '=' . ($fields[$field] ?? '');
    }

    return base64_encode(hash_hmac('sha256', implode(',', $signed), $secretKey, true));
}
```

*   **Example signing string:**`merchant=MERCHANT_123,operation=PURCHASE,order_amount=100000,currency=VND,order_invoice_number=INV_20231201_001,order_description=Pay order #12345,customer_id=CUST_001,success_url=https://yoursite.com/success,error_url=https://yoursite.com/error,cancel_url=https://yoursite.com/cancel`

* * *

Important Notes

1.   **Invoice number:**`order_invoice_number` must be unique and non-duplicated
2.   **Amount:** VND only; amount must be > 0 for `PURCHASE`
3.   **Callback URLs:** Must be publicly accessible from the internet
4.   **Signature:** Always validate the signature to ensure data integrity
5.   **Environment:** Use sandbox for testing; production for real transactions
