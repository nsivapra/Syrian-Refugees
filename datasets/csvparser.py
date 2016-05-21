import pandas
from pandas import DataFrame, read_csv
from collections import Counter
import numpy

#Quick script to merge data... Do some manual clean up later on the resulting .csv file.
#unfortunately, we have duplicate data in our rows in one of our datasets that is intended 
#to be combined with the 'country' column to form the key, but because one's a row and one's a column,
#it'll make this a bit harder with pandas.

population_DataFrame = pandas.read_csv('population.csv', index_col=0)

population_dictionary = {}
for row in population_DataFrame.index: #row is country
    for column in population_DataFrame.columns: #column is year
        population_dictionary[row+','+column] = population_DataFrame.at[row,column]

refugee_DataFrame = pandas.read_csv('unhcr_popstats_export_persons_of_concern_2016_05_20_234745.csv', index_col=['Year', 'Country / territory of asylum/residence'])
    
for i in xrange(0, len(refugee_DataFrame.index)):
    key = refugee_DataFrame.index[i][1]+','+str(refugee_DataFrame.index[i][0])
    refugee_DataFrame.ix[str(refugee_DataFrame.index[i]), 'Population'] = 0 #initialize to 0, for those with no info on population
    if (key in population_dictionary):
       
        reduced_dict[key] = population_dictionary[key]

        refugee_DataFrame.ix[str(refugee_DataFrame.index[i]), 'Population'] = population_dictionary[key]

        #print(refugee_DataFrame.ix[refugee_DataFrame.index[i], refugee_DataFrame.iat[i,0]])
        #print(refugee_DataFrame.iat[i,0]+','+str(refugee_DataFrame.index[i])) 

refugee_DataFrame.to_csv("out.csv", sep='\t')
 
#out.csv will have a bunch of tuples appended to the end, 
#just copy and paste the populations column and move it to the top. Order is preserved.

#refugee_DataFrame['Population of Country']=' '.join(refugee_DataFrame['Country / territory of asylum/residence']+','+str(refugee_DataFrame.index[0]))
