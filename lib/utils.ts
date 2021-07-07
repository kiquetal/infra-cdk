import { IConstruct, Tags } from "@aws-cdk/core";
import { format } from 'date-fns'

export  class Utils {


    
    private static tags:Map<string,string> = new Map(
    [
        ["creator","enrique.melgarejo@edge.com.py"],
        ["edge:project","tigosports"],
        ["edge:client","millicom"],
        ["created-date",format(new Date(),'yyyy-MM-dd-HH:mm:ssa')]
    ]);



   public static  createTagFromDefault(resource:IConstruct) {

        for ( let [key,value] of this.tags)
        {

            Tags.of(resource).add(key,value);
        }



    }
    public static addTagToResource(name:string,val:string,obj:IConstruct) {

        Tags.of(obj).add(name,val);

    }

}