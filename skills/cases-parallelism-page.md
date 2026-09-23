paralallelism page has the functionality call two api response java and go, then compare the results.

API is:
request: /api/counter?n=1000000&countDelay=1000&parallelProcess=500000
java server: http://localhost:8080/
go server: http://localhost:8081/
response: 
{
  "summary": {
    "request": {
      "n": 8,
      "countDelay": 1000,
      "parallelProcess": "8"
    },
    "response": {
      "startTime": "15:21:41 62290940Z",
      "endTime": "15:21:42 63386010Z",
      "durationMs": 1010,
      "durationFormatted": "00:00:01:010"
    }
  },
  "counters": [
    {
      "number": 1,
      "completedTime": "15:21:42 63386010Z",
      "processId": "pool-2-thread-1"
    },
    {
      "number": 2,
      "completedTime": "15:21:42 63386010Z",
      "processId": "pool-2-thread-2"
    },
    ............
    {
      "number": 1000000,
      "completedTime": "15:21:42 63386010Z",
      "processId": "pool-2-thread-8"
    }
  ]
}

The page must have 3 main layers/divs:

1- Parameters
allow the user choose the 3 parameter and submit button "Run" to booth api servers (java and go)

2- Api Responses
show the responses of the apis, side by side. 

3-Conclusion with the data result comparation of both responses

 