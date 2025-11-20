import java.util.*;

public class Main 
{
    public static void main(String[] args) 
    {
        Scanner sc = new Scanner(System.in);

        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();

        int[] arr = new int[n];

        System.out.println("Enter the elements:");
        for (int i = 0; i < n; i++) 
        {
            arr[i] = sc.nextInt();
        }
        int result = findSecondLargestUnique(arr);
        System.out.println("Second largest unique number: " + result);
    }
    
    public static int findSecondLargestUnique(int[] nums) 
    {
        Integer first = null, second = null;
        Set<Integer> seen = new HashSet<>();

        for (int num : nums) 
        {
            if (seen.contains(num)) continue;
            seen.add(num);

            if (first == null || num > first) 
            {
                second = first;
                first = num;
            } 
            else if ((second == null || num > second) && num != first) 
            {
                second = num;
            }
        }
        return second == null ? -1 : second;
    }
}
