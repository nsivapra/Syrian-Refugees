mydata = read.csv("titanic_original.csv")
mydata$embarked[mydata$embarked == ""] <- "S"
mydata$embarked

mydata$age[is.na(mydata$age)] <- mean(mydata$age, na.rm = TRUE)
  
mydata$boat <- as.character(mydata$boat)
mydata$boat[mydata$boat == ""] <- NA

mydata$has_cabin_number <- ifelse(mydata$cabin != "", 1, 0)