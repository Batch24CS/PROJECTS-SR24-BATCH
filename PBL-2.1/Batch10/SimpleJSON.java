import java.util.*;

/**
 * Simple JSON serializer for Java-Python communication
 * No external dependencies needed
 */
public class SimpleJSON {

    public static String toJSON(HashMap<String, Object> map) {
        StringBuilder json = new StringBuilder();
        json.append("{");

        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            first = false;

            json.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();

            if (value instanceof String) {
                json.append("\"").append(escapeJSON(value.toString())).append("\"");
            } else if (value instanceof Number) {
                json.append(value);
            } else if (value instanceof Boolean) {
                json.append(value);
            } else if (value instanceof ArrayList) {
                json.append(arrayListToJSON((ArrayList<?>) value));
            } else if (value instanceof HashMap) {
                json.append(toJSON((HashMap<String, Object>) value));
            } else {
                json.append("\"").append(escapeJSON(value.toString())).append("\"");
            }
        }

        json.append("}");
        return json.toString();
    }

    private static String arrayListToJSON(ArrayList<?> list) {
        StringBuilder json = new StringBuilder();
        json.append("[");

        boolean first = true;
        for (Object item : list) {
            if (!first) {
                json.append(",");
            }
            first = false;

            if (item instanceof String) {
                json.append("\"").append(escapeJSON(item.toString())).append("\"");
            } else if (item instanceof Number) {
                json.append(item);
            } else {
                json.append("\"").append(escapeJSON(item.toString())).append("\"");
            }
        }

        json.append("]");
        return json.toString();
    }

    private static String escapeJSON(String text) {
        return text.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}