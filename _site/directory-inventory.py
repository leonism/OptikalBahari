import os

# Start editable vars
outputfile = "/Volumes/DATA/Jekyll/OptikalBahari/assets/img/inventory.txt"  # File to save the results to
folder = "/Volumes/DATA/Jekyll/OptikalBahari/assets/img/"  # The folder to inventory
exclude_strings = ['Thumbs.db', '.tmp', '.css', '.html', '.md', '.js', '.DS_Store']  # Exclude files containing these strings
# End editable vars

def write_inventory(folder, output_file, exclude):
    with open(output_file, "w") as txtfile:
        for path, dirs, files in os.walk(folder):
            sep = "\n---------- " + path + " ----------"
            print(sep)
            txtfile.write("%s\n" % sep)

            for fn in sorted(files):
                if not any(exclude_str in fn for exclude_str in exclude):
                    file_path = os.path.join(path, fn)
                    filename, file_extension = os.path.splitext(file_path)
                    print(file_path)
                    txtfile.write("%s\n" % file_path)

# Call the function to write the inventory
write_inventory(folder, outputfile, exclude_strings)