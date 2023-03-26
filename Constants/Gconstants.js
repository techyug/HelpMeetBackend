const MessageStatus={
    sentButNotReceivedAnyResponse:0,
    sentAndMessegeDeliveryPending:1,
    sentAndMessgeDelivered:2,
    sendAndMessageSeenByReceiver:3,
    messageDeletedBySender:4,
    messageReceived:9,
    messageReceivedandSeen:8,
}
module.exports = MessageStatus;