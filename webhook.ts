// Received webhook: {
//   event: 'charge.completed',
//   data: {
//     id: 8321945,
//     tx_ref: 'order_1736846575470',
//     flw_ref: '8016915561111736846576262',
//     device_fingerprint: 'N/A',
//     amount: 50000,
//     currency: 'NGN',
//     charged_amount: 50000,
//     app_fee: 700,
//     merchant_fee: 0,
//     processor_response: 'success',
//     auth_model: 'AUTH',
//     ip: '54.75.161.64',
//     narration: 'Damilola Aguda 1720455877276',
//     status: 'successful',
//     payment_type: 'bank_transfer',
//     created_at: '2025-01-14T09:23:03.000Z',
//     account_id: 2508309,
//     customer: {
//       id: 2571514,
//       name: 'jo boy',
//       phone_number: '6756453647664',
//       email: '****',
//       created_at: '2025-01-14T09:22:55.000Z'
//     }
//   },
//   meta_data: {
//     sideNote: 'This is a side note to track this payment request',
//     originatoraccountnumber: '123*******90',
//     originatorname: 'JOHN DOE',
//     bankname: 'Access Bank',
//     originatoramount: 'N/A'
//   },
//   'event.type': 'BANK_TRANSFER_TRANSACTION'
// };

// {
//     "status": "success",
//     "message": "Invoice created successfully",
//     "data": {
//         "invoice_id": "1102362",
//         "products": "machine, new 1",
//         "total_price": 50000,
//         "status": "awaiting_payment",
//         "payment_details": {
//             "transfer_reference": "MockFLWRef-1736846576210",
//             "transfer_account": "0067100155",
//             "transfer_bank": "Mock Bank",
//             "account_expiration": 1736850176210,
//             "transfer_note": "Mock note",
//             "transfer_amount": "50000.00",
//             "mode": "banktransfer"
//         },
//         "reference": "MockFLWRef-1736846576210",
//         "product_owner": {
//             "id": "2fb7b0ef-7b56-4604-ae5b-cc6a7b93eeed"
//         },
//         "customer_name": null,
//         "customer_email": null,
//         "id": "99c84986-fe62-494b-be54-f31866653f84",
//         "created_at": "2025-01-14T08:22:56.480Z",
//         "updated_at": "2025-01-14T08:22:56.480Z"
//     }
// }


// Error processing webhook: The "key" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, DataView, KeyObject, or CryptoKey. Received undefined