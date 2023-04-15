const MessageStatus={
    sentButNotReceivedAnyResponse:0,
    sentAndMessegeDeliveryPending:1,
    sentAndMessgeDelivered:2,
    sendAndMessageSeenByReceiver:3,
    messageDeletedBySender:4,
    messageReceived:9,
    messageReceivedandSeen:8,
}
const BookingStatus = {
    bookingDeleted:0,
    newBookingRequest :1,
    acceptedByServiceProvider:2,
    cancelledByServiceProvider:3,
    cancelledByUser:4
}
module.exports = {MessageStatus,BookingStatus};