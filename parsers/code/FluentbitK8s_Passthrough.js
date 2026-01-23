// Description:
// Default Fluentbit K8s event passthrough

// Data input format: ({ obj, size }) or ( doc )
function main({obj, size}) {

   if (obj.date) {
     let t = new Time("2006-01-02T15:04:05.000000Z", obj.date)
     obj["@timestamp"] = t.UnixMilli()
   } else {
     let t = new Time()
     obj["@timestamp"] = t.UnixMilli()
   }   
   obj["@eventType"]="FluentbitK8sLog"
   return "pass"
}
