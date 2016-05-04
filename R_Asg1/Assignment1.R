mydata = read.csv("refine_original.csv")
mydata
mydata[1:6, "company"] <- "philips"
mydata[7:13, "company"] <- "akzo"
mydata[14:16, "company"] <- "philips"
mydata[17:21, "company"] <- "van houten"
mydata[22:25, "company"] <- "unilever"

mydata <- separate(mydata, Product.code...number, into = c("Product Code", "number"), sep = "-", extra = "merge" )

mydata$Category <- NA
mydata$Category[mydata$`Product Code` == "p"] <- "Smart Phone"
mydata$Category[mydata$`Product Code` == "v"] <- "TV"
mydata$Category[mydata$`Product Code` == "x"] <- "Laptop"
mydata$Category[mydata$`Product Code` == "q"] <- "Tablet"

mydata$full_address <- do.call(paste, c(mydata[c("address", "city", "country")], sep = ","))

mydata$company_phillips <- ifelse(mydata$company == "philips", 1, 0)
mydata$company_akzo <- ifelse(mydata$company == "akzo", 1, 0)
mydata$company_van_houten <- ifelse(mydata$company == "van houten", 1, 0)
mydata$company_unilever <- ifelse(mydata$company == "unilever", 1, 0)
mydata$product_smartphone <- ifelse(mydata$Category == "Smart Phone", 1, 0)
mydata$product_tv <- ifelse(mydata$Category == "TV", 1, 0)
mydata$product_laptop <- ifelse(mydata$Category == "Laptop", 1, 0)
mydata$product_tablet <- ifelse(mydata$Category == "Tablet", 1, 0)
