from roboflow import Roboflow
import supervision as sv
import cv2
import matplotlib.pyplot as plt
import os 

rf = Roboflow(api_key="bpJypKut1hXTKzMnGwEM")
project = rf.workspace().project("book-spines-fi8nq")
model = project.version(1).model

result = model.predict("high_res_images/IMG_2278.jpg", confidence=10, overlap=50).json()
# result = model.predict("high_res_images/IMG_2278.jpg", confidence=30, overlap=30).json()

labels = [item["class"] for item in result["predictions"]]

detections = sv.Detections.from_inference(result)
# detections = sv.Detections.from_roboflow(result)

label_annotator = sv.LabelAnnotator()
bounding_box_annotator = sv.BoxAnnotator()

image = cv2.imread("high_res_images/IMG_2278.jpg")

annotated_image = bounding_box_annotator.annotate(scene=image, detections=detections)
annotated_image = label_annotator.annotate(scene=annotated_image, detections=detections, labels=labels)

# Display the result image with detected boundaries
plt.figure(figsize=(15, 10))
plt.imshow(annotated_image)
plt.title("Verify Detected Book Spines")
plt.axis('off')

output_dir="extracted_spines"

# Save the figure to a temporary file to show in terminal or notebook
temp_img_path = os.path.join(output_dir, "temp_verification.png")
plt.savefig(temp_img_path)
plt.close()

sv.plot_image(image=annotated_image, size=(15, 15))